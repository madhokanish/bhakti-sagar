import Foundation
import StoreKit

/// StoreKit 2 wrapper for the BhaktiChat Pro auto-renewing subscription.
///
/// To see the real Apple purchase sheet in the simulator, enable the bundled
/// `Configuration.storekit` file in the scheme:
///   Product → Scheme → Edit Scheme → Run → Options →
///   StoreKit Configuration → BhaktiChatIOSApp/Configuration.storekit
///
/// In production the product IDs below must also exist in App Store Connect
/// with matching subscription group / introductory offer.
@MainActor
final class SubscriptionManager: ObservableObject {

    // MARK: - Product IDs

    static let weeklyProductID = "com.bhaktichat.pro.weekly"
    static let yearlyProductID = "com.bhaktichat.pro.yearly"
    static let allProductIDs: [String] = [weeklyProductID, yearlyProductID]

    // MARK: - Published state

    @Published private(set) var products: [Product] = []
    @Published private(set) var purchasedProductIDs: Set<String> = []
    @Published private(set) var isLoadingProducts: Bool = false
    @Published private(set) var purchaseInFlight: Bool = false
    @Published var lastError: String? = nil

    // MARK: - Internals

    private var transactionListener: Task<Void, Error>?

    init() {
        transactionListener = listenForTransactionUpdates()
    }

    deinit {
        transactionListener?.cancel()
    }

    // MARK: - Lookups

    func product(for id: String) -> Product? {
        products.first(where: { $0.id == id })
    }

    var weekly: Product? { product(for: Self.weeklyProductID) }
    var yearly: Product? { product(for: Self.yearlyProductID) }

    var hasActiveSubscription: Bool {
        !purchasedProductIDs.isEmpty
    }

    // MARK: - Product loading

    func loadProductsIfNeeded() async {
        guard products.isEmpty, !isLoadingProducts else { return }
        await loadProducts()
    }

    func loadProducts() async {
        isLoadingProducts = true
        defer { isLoadingProducts = false }
        do {
            let fetched = try await Product.products(for: Self.allProductIDs)
            // Keep stable order: weekly first, yearly second.
            self.products = fetched.sorted { lhs, rhs in
                let order = Self.allProductIDs
                return (order.firstIndex(of: lhs.id) ?? Int.max)
                     < (order.firstIndex(of: rhs.id) ?? Int.max)
            }
            await refreshEntitlements()
        } catch {
            self.lastError = "Couldn't load subscription options. \(error.localizedDescription)"
        }
    }

    // MARK: - Purchase

    enum PurchaseOutcome {
        case success
        case userCancelled
        case pending
        case failed(String)
    }

    /// Triggers the real Apple StoreKit purchase sheet (with parental approval,
    /// Face ID, etc.). Returns the resolved outcome — call site is responsible
    /// for any further UI on success.
    func purchase(productID: String) async -> PurchaseOutcome {
        guard let product = product(for: productID) else {
            return .failed("Product not loaded. Please try again.")
        }
        guard !purchaseInFlight else { return .pending }
        purchaseInFlight = true
        defer { purchaseInFlight = false }

        do {
            let result = try await product.purchase()
            switch result {
            case .success(let verification):
                guard case .verified(let transaction) = verification else {
                    return .failed("Purchase could not be verified.")
                }
                await refreshEntitlements()
                await transaction.finish()
                return .success
            case .userCancelled:
                return .userCancelled
            case .pending:
                return .pending
            @unknown default:
                return .failed("Unknown purchase result.")
            }
        } catch {
            return .failed(error.localizedDescription)
        }
    }

    // MARK: - Restore

    func restorePurchases() async {
        do {
            try await AppStore.sync()
            await refreshEntitlements()
        } catch {
            lastError = "Restore failed: \(error.localizedDescription)"
        }
    }

    // MARK: - Entitlement refresh

    func refreshEntitlements() async {
        var owned: Set<String> = []
        for await result in Transaction.currentEntitlements {
            if case .verified(let transaction) = result {
                // Only count active (not expired/revoked) auto-renewable subs.
                if transaction.revocationDate == nil,
                   transaction.productType == .autoRenewable {
                    owned.insert(transaction.productID)
                }
            }
        }
        purchasedProductIDs = owned
    }

    // MARK: - Transaction listener

    private func listenForTransactionUpdates() -> Task<Void, Error> {
        Task.detached { [weak self] in
            for await result in Transaction.updates {
                guard case .verified(let transaction) = result else { continue }
                await self?.refreshEntitlements()
                await transaction.finish()
            }
        }
    }
}

// MARK: - Display helpers

extension Product {
    /// Localized display price using the user's StoreKit locale. Falls back to
    /// the placeholder if not loaded.
    var bhaktiDisplayPrice: String { displayPrice }
}
