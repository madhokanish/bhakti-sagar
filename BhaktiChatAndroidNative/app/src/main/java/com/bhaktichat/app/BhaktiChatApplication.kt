package com.bhaktichat.app

import android.app.Application
import android.content.Context
import android.content.res.Configuration
import android.os.LocaleList
import androidx.lifecycle.ProcessLifecycleOwner
import com.bhaktichat.app.data.auth.AuthRepository
import com.bhaktichat.app.data.subscription.preloadRazorpay
import com.bhaktichat.app.domain.AppLanguage
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.LanguageStore
import com.google.android.gms.ads.MobileAds
import com.google.android.gms.ads.RequestConfiguration
import java.util.Locale
import kotlin.concurrent.thread

class BhaktiChatApplication : Application() {
    /**
     * Owned here rather than by [AppContainer] because the container only exists once a user
     * is authenticated, while the locale and AuthRepository both need the language earlier —
     * attachBaseContext runs before onCreate, and sign-in errors are produced before anyone
     * has signed in. One instance process-wide keeps its StateFlow authoritative.
     */
    lateinit var languageStore: LanguageStore
        private set

    lateinit var authRepository: AuthRepository
        private set
    private var activeContainer: AppContainer? = null
    private var activeUserId: String? = null

    val container: AppContainer
        get() = checkNotNull(activeContainer) { "Authenticated app container is not active" }

    override fun attachBaseContext(base: Context) {
        // Follows the user's choice instead of pinning Hindi. This drives the surfaces the
        // app does not draw itself — Google's consent form, system date/number formatting —
        // so they match the in-app language rather than contradicting it.
        //
        // Read from prefs directly: this runs before onCreate, so nothing else exists yet.
        languageStore = LanguageStore(base)
        val tag = when (languageStore.language.value) {
            AppLanguage.HINDI -> HINDI_LANGUAGE_TAG
            else -> ENGLISH_LANGUAGE_TAG
        }
        val locale = Locale.forLanguageTag(tag)
        Locale.setDefault(locale)
        LocaleList.setDefault(LocaleList(locale))
        val configuration = Configuration(base.resources.configuration).apply {
            setLocale(locale)
            setLocales(LocaleList(locale))
        }
        super.attachBaseContext(base.createConfigurationContext(configuration))
    }

    override fun onCreate() {
        super.onCreate()
        // Keep SDK-owned surfaces (for example Google's consent form) in the same
        // Devanagari Hindi experience as the rest of the application.
        // Analytics first, so early lifecycle events are captured. No-op if no key is set.
        Analytics.init(
            context = this,
            apiKey = BuildConfig.POSTHOG_API_KEY,
            host = BuildConfig.POSTHOG_HOST,
            debug = BuildConfig.DEBUG
        )
        // Razorpay preload fetches checkout preferences and enumerates installed UPI apps.
        // Started here (on a background thread — doing it on the main thread previously
        // caused a startup ANR) so it has the whole session to finish rather than the few
        // seconds between opening चढ़ावा and tapping pay.
        preloadRazorpay(this)

        authRepository = AuthRepository(
            context = this,
            baseUrl = BuildConfig.API_BASE_URL,
            googleWebClientId = BuildConfig.GOOGLE_WEB_CLIENT_ID,
            languageStore = languageStore
        )

        // AdMob. initialize() does I/O, so run it off the main thread. It does NOT itself
        // request ads — actual ad loads happen on screen and are gated by UMP consent
        // (gathered after authentication). Emulators serve test ads automatically; in debug we
        // also mark this build as a test device so physical dev phones get test ads too.
        thread(name = "mobile-ads-init") {
            if (BuildConfig.DEBUG) {
                MobileAds.setRequestConfiguration(
                    RequestConfiguration.Builder()
                        .setTestDeviceIds(listOf("EMULATOR"))
                        .build()
                )
            }
            MobileAds.initialize(this) { }
        }
    }

    @Synchronized
    fun activateUser(userId: String): AppContainer {
        if (activeUserId == userId) return checkNotNull(activeContainer)
        deactivateUser()
        authRepository.currentSession?.user?.let { user ->
            Analytics.identify(userId = user.id, email = user.email, name = user.name)
        }
        AppContainer.migrateLegacyDatabaseIfNeeded(this, userId)
        return AppContainer(this, userId, authRepository, languageStore).also { created ->
            activeContainer = created
            activeUserId = userId
            // Tracks accumulated foreground time for review-prompt eligibility.
            ProcessLifecycleOwner.get().lifecycle.addObserver(created.reviewPromptStore)
        }
    }

    @Synchronized
    fun deactivateUser() {
        activeContainer?.let { current ->
            ProcessLifecycleOwner.get().lifecycle.removeObserver(current.reviewPromptStore)
            current.close()
        }
        activeContainer = null
        activeUserId = null
    }

    suspend fun signOut() {
        authRepository.signOut()
        deactivateUser()
    }

    suspend fun deleteAccountAndLocalData(): Result<Unit> {
        val userId = authRepository.currentSession?.user?.id
            ?: return Result.failure(IllegalStateException("Not signed in"))
        val result = authRepository.deleteAccount()
        if (result.isFailure) return Result.failure(checkNotNull(result.exceptionOrNull()))
        deactivateUser()
        deleteDatabase(AppContainer.accountDatabaseName(userId))
        clearAccountPreferences()
        return Result.success(Unit)
    }

    private fun clearAccountPreferences() {
        listOf(
            "bhakti_bookmarks",
            "saved_aartis",
            "bhakti_entitlements",
            "bhakti_anon",
            "bhakti_streak",
            "bhakti_review_prompt",
            "bhaktichat_prefs",
            "bhakti_notifications",
            "theme_prefs"
        ).forEach { name -> getSharedPreferences(name, MODE_PRIVATE).edit().clear().commit() }
    }

    private companion object {
        const val HINDI_LANGUAGE_TAG = "hi-IN"
        const val ENGLISH_LANGUAGE_TAG = "en-IN"
    }
}
