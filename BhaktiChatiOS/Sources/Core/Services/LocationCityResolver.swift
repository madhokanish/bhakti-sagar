import Foundation

#if canImport(CoreLocation)
import CoreLocation

@MainActor
final class LocationCityResolver: NSObject, ObservableObject, @preconcurrency CLLocationManagerDelegate {
    enum ResolverError: LocalizedError {
        case servicesDisabled
        case permissionDenied
        case locationUnavailable

        var errorDescription: String? {
            switch self {
            case .servicesDisabled:
                return "Location services are turned off. Enable them to auto-detect your city."
            case .permissionDenied:
                return "Location access is needed to auto-detect your city."
            case .locationUnavailable:
                return "We could not determine your location just now. Please try again."
            }
        }
    }

    @Published private(set) var isLocating = false

    private let manager = CLLocationManager()
    private var authorizationContinuation: CheckedContinuation<Void, Error>?
    private var locationContinuation: CheckedContinuation<CLLocation, Error>?

    override init() {
        super.init()
        manager.delegate = self
        manager.desiredAccuracy = kCLLocationAccuracyKilometer
    }

    func nearestCity(
        from cities: [ChoghadiyaCity],
        promptIfNeeded: Bool = true
    ) async throws -> ChoghadiyaCity {
        let location = try await requestLocation(promptIfNeeded: promptIfNeeded)
        guard let nearest = cities.min(by: {
            location.distance(from: CLLocation(latitude: $0.lat, longitude: $0.lon))
            < location.distance(from: CLLocation(latitude: $1.lat, longitude: $1.lon))
        }) else {
            throw ResolverError.locationUnavailable
        }
        return nearest
    }

    private func requestLocation(promptIfNeeded: Bool) async throws -> CLLocation {
        guard CLLocationManager.locationServicesEnabled() else {
            throw ResolverError.servicesDisabled
        }

        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            break
        case .notDetermined:
            guard promptIfNeeded else {
                throw ResolverError.permissionDenied
            }
            try await requestAuthorization()
        case .denied, .restricted:
            throw ResolverError.permissionDenied
        @unknown default:
            throw ResolverError.locationUnavailable
        }

        return try await withCheckedThrowingContinuation { continuation in
            isLocating = true
            locationContinuation = continuation
            manager.requestLocation()
        }
    }

    private func requestAuthorization() async throws {
        try await withCheckedThrowingContinuation { continuation in
            authorizationContinuation = continuation
            manager.requestWhenInUseAuthorization()
        }
    }

    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        guard let continuation = authorizationContinuation else { return }
        authorizationContinuation = nil

        switch manager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            continuation.resume()
        case .denied, .restricted:
            continuation.resume(throwing: ResolverError.permissionDenied)
        case .notDetermined:
            authorizationContinuation = continuation
        @unknown default:
            continuation.resume(throwing: ResolverError.locationUnavailable)
        }
    }

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        isLocating = false
        guard let continuation = locationContinuation else { return }
        locationContinuation = nil

        if let location = locations.last {
            continuation.resume(returning: location)
        } else {
            continuation.resume(throwing: ResolverError.locationUnavailable)
        }
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        isLocating = false
        guard let continuation = locationContinuation else { return }
        locationContinuation = nil
        continuation.resume(throwing: error)
    }
}

#else

@MainActor
final class LocationCityResolver: NSObject, ObservableObject {
    @Published private(set) var isLocating = false

    func nearestCity(
        from cities: [ChoghadiyaCity],
        promptIfNeeded: Bool = true
    ) async throws -> ChoghadiyaCity {
        _ = promptIfNeeded
        guard let city = cities.first else {
            throw NSError(domain: "LocationCityResolver", code: 0)
        }
        return city
    }
}

#endif
