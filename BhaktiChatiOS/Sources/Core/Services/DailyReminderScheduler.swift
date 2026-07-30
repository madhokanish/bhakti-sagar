import Foundation

#if canImport(UserNotifications)
import UserNotifications
#endif

#if canImport(UIKit)
import UIKit
#endif

/// Schedules/cancels the daily devotional reminder notification. Shared between the Profile
/// screen's manual toggle and the app-launch auto-enrollment (see BhaktiChatIOSApp) so both
/// paths post the exact same notification content.
enum DailyReminderScheduler {
    static let identifier = "bhakti.daily.reminder"

    /// Requests notification permission (shows the system prompt) and, on grant, schedules the
    /// daily reminder for `hour:minute`. Calls back on the main thread with whether it's now
    /// actually enabled — the caller should reflect that in `notificationsEnabled`.
    static func requestAuthorizationAndSchedule(hour: Int, minute: Int, completion: @escaping (Bool) -> Void) {
        #if canImport(UserNotifications)
        UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .badge, .sound]) { granted, _ in
            DispatchQueue.main.async {
                if granted {
                    #if canImport(UIKit)
                    UIApplication.shared.registerForRemoteNotifications()
                    #endif
                    schedule(hour: hour, minute: minute)
                }
                completion(granted)
            }
        }
        #else
        completion(false)
        #endif
    }

    // Notification copy matches Android's DailyReminderReceiver exactly.
    static func schedule(hour: Int, minute: Int) {
        #if canImport(UserNotifications)
        let center = UNUserNotificationCenter.current()
        center.removePendingNotificationRequests(withIdentifiers: [identifier])

        let content = UNMutableNotificationContent()
        content.title = "🕉️ Time for your daily reflection."
        content.body = "Pause for a moment with BhaktiChat."
        content.sound = .default

        var date = DateComponents()
        date.hour = hour
        date.minute = minute
        let trigger = UNCalendarNotificationTrigger(dateMatching: date, repeats: true)

        let request = UNNotificationRequest(identifier: identifier, content: content, trigger: trigger)
        center.add(request, withCompletionHandler: nil)
        #endif
    }

    static func cancel() {
        #if canImport(UserNotifications)
        UNUserNotificationCenter.current().removePendingNotificationRequests(withIdentifiers: [identifier])
        #endif
    }
}
