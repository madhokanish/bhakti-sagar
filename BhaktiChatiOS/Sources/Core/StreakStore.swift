import Foundation

/// Tracks a daily "darshan" streak — the number of consecutive local days the user has
/// opened the app. A devotional daily-ritual mechanic (nitya darshan); loss-aversion on
/// the streak is a strong daily-return hook.
///
/// Mirrors Android's `util/StreakStore.kt`, using `Calendar`'s local-midnight day boundary
/// instead of manual UTC-offset arithmetic.
@MainActor
final class StreakStore: ObservableObject {
    @Published private(set) var currentStreak: Int
    @Published private(set) var longestStreak: Int

    private let defaults: UserDefaults
    private let calendar = Calendar.current

    init(defaults: UserDefaults = .standard) {
        self.defaults = defaults
        currentStreak = defaults.integer(forKey: Keys.current)
        longestStreak = defaults.integer(forKey: Keys.longest)
    }

    /// Call once per app open. First visit of a new day increments the streak; a visit the
    /// day after the last counts as consecutive, a longer gap resets to 1. Same-day repeat
    /// opens are no-ops.
    func recordVisit() {
        let today = calendar.startOfDay(for: Date())
        let lastDay = defaults.object(forKey: Keys.lastDay) as? Date

        if let lastDay, calendar.isDate(lastDay, inSameDayAs: today) { return }

        let isConsecutive: Bool
        if let lastDay, let expectedNextDay = calendar.date(byAdding: .day, value: 1, to: lastDay) {
            isConsecutive = calendar.isDate(expectedNextDay, inSameDayAs: today)
        } else {
            isConsecutive = false
        }

        let next = isConsecutive ? currentStreak + 1 : 1
        let longest = max(longestStreak, next)

        defaults.set(today, forKey: Keys.lastDay)
        defaults.set(next, forKey: Keys.current)
        defaults.set(longest, forKey: Keys.longest)
        currentStreak = next
        longestStreak = longest
    }

    private enum Keys {
        static let lastDay = "bhakti_streak_last_visit_day"
        static let current = "bhakti_streak_current"
        static let longest = "bhakti_streak_longest"
    }
}
