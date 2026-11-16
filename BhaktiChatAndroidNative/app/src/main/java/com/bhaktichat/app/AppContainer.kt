package com.bhaktichat.app

import android.content.Context
import androidx.room.Room
import androidx.room.withTransaction
import com.bhaktichat.app.data.auth.AuthRepository
import com.bhaktichat.app.data.subscription.SubscriptionRepository
import com.bhaktichat.app.data.billing.SubscriptionManager
import com.bhaktichat.app.data.local.AppDatabase
import com.bhaktichat.app.data.local.MIGRATION_3_4
import com.bhaktichat.app.data.local.SavedAartisStore
import com.bhaktichat.app.data.remote.ChatApi
import com.bhaktichat.app.data.remote.ChatApiClient
import com.bhaktichat.app.data.remote.DivineFeedbackClient
import com.bhaktichat.app.data.remote.DivineImageGenerator
import com.bhaktichat.app.data.remote.OkHttpChatApi
import com.bhaktichat.app.data.remote.PromptAwareChatApiClient
import com.bhaktichat.app.data.remote.RemoteDivineImageGenerator
import com.bhaktichat.app.data.remote.VoiceSessionApi
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.data.repo.ReelsRepository
import com.bhaktichat.app.data.repo.ChoghadiyaRepository
import com.bhaktichat.app.data.repo.DefaultGuidesRepository
import com.bhaktichat.app.data.repo.DivineCreationRepository
import com.bhaktichat.app.data.repo.DivineTemplateRepository
import com.bhaktichat.app.data.repo.GuidesRepository
import com.bhaktichat.app.data.repo.InMemoryDivineCreationRepository
import com.bhaktichat.app.data.repo.MessagesRepository
import com.bhaktichat.app.data.repo.RoomMessagesRepository
import com.bhaktichat.app.data.repo.RoomThreadsRepository
import com.bhaktichat.app.data.repo.StaticDivineTemplateRepository
import com.bhaktichat.app.data.repo.ThreadsRepository
import com.bhaktichat.app.util.AnonUserKey
import com.bhaktichat.app.util.BookmarkStore
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.ChatNudgeStore
import com.bhaktichat.app.util.ReviewPromptStore
import com.bhaktichat.app.util.LanguageStore
import com.bhaktichat.app.util.StreakStore
import okhttp3.OkHttpClient
import okhttp3.JavaNetCookieJar
import java.net.CookieManager
import java.net.CookiePolicy
import java.security.MessageDigest
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AppContainer(
    context: Context,
    val userId: String,
    private val authRepository: AuthRepository,
    val languageStore: LanguageStore,
    /** A guest's database to fold into this one; see [adoptGuestHistoryIfNeeded]. */
    private var guestDatabaseToAdopt: String? = null
) {
    private val appContext = context.applicationContext
    private val cookieManager = CookieManager().apply {
        setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER)
    }

    private val databaseName = accountDatabaseName(userId)
    private val db: AppDatabase = openDatabase(appContext, databaseName)

    // Bounded client for ordinary request/response calls (image, feedback, choghadiya).
    private val baseHttpClient: OkHttpClient = OkHttpClient.Builder()
        .cookieJar(JavaNetCookieJar(cookieManager))
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    // Only requests to the BhaktiChat backend inherit this client. The direct OpenAI voice
    // WebSocket deliberately uses [baseHttpClient] so our account token is never sent there.
    private val httpClient: OkHttpClient = baseHttpClient.newBuilder()
        .addInterceptor { chain ->
            val request = chain.request().newBuilder().apply {
                authRepository.authorizationHeader()?.let { header("Authorization", it) }
                // Guests have no Authorization header, so this is the only thing tying them
                // to their own server-side conversations. It has to be stable across
                // launches: the cookie jar is in-memory, so relying on the backend's anon
                // cookie alone would hand every guest a fresh identity — and an amnesiac
                // guide — on every cold start.
                header(ANON_ID_HEADER, AnonUserKey.get(appContext))
                // Opts this client into server-side enforcement of the चढ़ावा-only features
                // (divine images, voice). iOS does not send it and is not enforced, because
                // it has no purchase path for the server to recognise.
                header(CLIENT_HEADER, CLIENT_ANDROID)
            }.build()
            chain.proceed(request)
        }
        .build()

    // Streaming chat holds the SSE connection open for the whole response. The read timeout
    // is an idle timeout between chunks, and the server sends `meta` immediately, so a
    // generous bound only trips on a genuinely stalled stream instead of hanging forever.
    private val streamingHttpClient: OkHttpClient = httpClient.newBuilder()
        .readTimeout(120, TimeUnit.SECONDS)
        .build()

    // Divine-image generation is a long server-side job (~60–90s), so the 30s read
    // timeout on [httpClient] would abort it. Give it a generous bounded timeout.
    private val imageHttpClient: OkHttpClient = httpClient.newBuilder()
        .readTimeout(120, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val chatApi: ChatApi = OkHttpChatApi(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = streamingHttpClient
    )

    // Voice Mode's WebSocket connects directly to OpenAI, not our own API, and stays open
    // for the whole call — needs no read timeout (like streamingHttpClient) plus a ping
    // interval, or idle NAT/carrier middleboxes silently drop the connection with no error.
    val voiceWebSocketClient: OkHttpClient = baseHttpClient.newBuilder()
        .readTimeout(0, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    val voiceSessionApi = VoiceSessionApi(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = httpClient
    )

    val savedAartisStore = SavedAartisStore(appContext)
    val bookmarkStore = BookmarkStore(appContext)
    val entitlementStore = EntitlementStore(appContext)
    val streakStore = StreakStore(appContext)
    val reviewPromptStore = ReviewPromptStore(appContext)
    val chatNudgeStore = ChatNudgeStore(appContext)
    val subscriptionManager = SubscriptionManager(appContext, entitlementStore, languageStore)

    // Chadhaava (Razorpay UPI AutoPay) — the current subscription rail. [subscriptionManager]
    // above is the legacy Play Billing path, kept only so grandfathered subscribers from
    // before the ad-model pivot are still recognised; the two write to separate flags in
    // [EntitlementStore] so neither can revoke the other.
    val subscriptionRepository = SubscriptionRepository(
        baseUrl = BuildConfig.API_BASE_URL,
        authRepository = authRepository,
        entitlementStore = entitlementStore,
        languageStore = languageStore
    )
    val guidesRepository: GuidesRepository = DefaultGuidesRepository()
    val threadsRepository: ThreadsRepository = RoomThreadsRepository(db.threadDao())
    val messagesRepository: MessagesRepository = RoomMessagesRepository(db.messageDao())
    val chatApiClient: ChatApiClient = PromptAwareChatApiClient(chatApi)
    val aartiRepository = AartiRepository(appContext, languageStore)
    val reelsRepository = ReelsRepository(appContext, aartiRepository)
    val choghadiyaRepository = ChoghadiyaRepository(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = httpClient,
        languageStore = languageStore
    )
    val divineTemplateRepository: DivineTemplateRepository = StaticDivineTemplateRepository()
    val divineCreationRepository: DivineCreationRepository = InMemoryDivineCreationRepository()
    val divineImageGenerator: DivineImageGenerator = RemoteDivineImageGenerator(
        context = appContext,
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = imageHttpClient
    )
    val divineFeedbackClient: DivineFeedbackClient = DivineFeedbackClient(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = httpClient
    )

    // App-scoped so it can preload on the Create screen and show over the generation wait.
    val interstitialAdManager = com.bhaktichat.app.ui.components.ads.InterstitialAdManager(
        isPro = { entitlementStore.isPro.value }
    )

    // Continuous aarti player (Media3 MediaController bound to AartiPlaybackService). App-scoped
    // so playback + the mini-player survive navigation between screens.
    val aartiPlayerController = com.bhaktichat.app.playback.AartiPlayerController(appContext, languageStore) {
        entitlementStore.isPro.value
    }

    /**
     * Folds a guest's conversations into this account's database, then empties the guest's
     * so a later sign-in cannot import them twice.
     *
     * [migrateLegacyDatabaseIfNeeded] only hands over the guest's file when the account has
     * no database yet. A guest who paid (silent checkout account) and then signed in to an
     * existing Google account would otherwise lose their chats to an orphaned file. One
     * conversation per guide: a guest thread for a guide the account already talks to is
     * merged into that thread (messages interleave by time); the rest are copied as they are.
     */
    suspend fun adoptGuestHistoryIfNeeded() {
        val sourceName = guestDatabaseToAdopt ?: return
        withContext(Dispatchers.IO) {
            if (!appContext.getDatabasePath(sourceName).exists()) return@withContext
            val guestDb = openDatabase(appContext, sourceName)
            try {
                val guestThreads = guestDb.threadDao().listAllThreadsIncludingArchived()
                db.withTransaction {
                    for (thread in guestThreads) {
                        val existing = if (thread.isArchived) null
                        else db.threadDao().getActiveThreadForGuide(thread.guideId)
                        val targetId = if (existing != null) {
                            db.threadDao().updateUpdatedAt(existing.id, maxOf(existing.updatedAt, thread.updatedAt))
                            existing.id
                        } else {
                            db.threadDao().insert(thread)
                            thread.id
                        }
                        guestDb.messageDao().listMessagesForThread(thread.id)
                            // A typing row left by an interrupted reply would spin forever.
                            .filterNot { it.isTypingIndicator }
                            .forEach { message -> db.messageDao().insert(message.copy(threadId = targetId)) }
                    }
                }
                guestDb.messageDao().deleteAll()
                guestDb.threadDao().deleteAllThreads()
            } finally {
                guestDb.close()
            }
        }
        guestDatabaseToAdopt = null
    }

    fun close() {
        subscriptionRepository.close()
        subscriptionManager.close()
        aartiPlayerController.release()
        db.close()
    }

    companion object {
        private const val LEGACY_DATABASE_NAME = "bhaktichat.db"
        private const val ANON_ID_HEADER = "x-bhakti-anon-id"
        private const val CLIENT_HEADER = "x-bhakti-client"
        private const val CLIENT_ANDROID = "android"

        /**
         * Container id for someone using the app without an account. Derived from the
         * per-install [AnonUserKey] rather than a fixed literal so that clearing app data
         * starts a genuinely clean guest, and so the name still goes through the same
         * hashing as a real account id.
         */
        fun guestUserId(context: Context): String = "guest_" + AnonUserKey.get(context)

        private fun openDatabase(context: Context, name: String): AppDatabase =
            Room.databaseBuilder(context, AppDatabase::class.java, name)
                // Never silently wipe user data (threads + chat history) on an upgrade. With no
                // migration for a version bump, Room will now throw instead of destroying the DB,
                // forcing a real Migration to be added via .addMigrations(...) before release.
                // Destroying is only tolerated on a downgrade, which shouldn't reach production, and
                // for v1/v2 files (e.g. an adopted pre-accounts bhaktichat.db) that no migration path
                // reaches — those would otherwise throw on open and crash the container.
                .addMigrations(MIGRATION_3_4)
                .fallbackToDestructiveMigrationFrom(dropAllTables = true, 1, 2)
                .fallbackToDestructiveMigrationOnDowngrade(dropAllTables = true)
                .build()

        fun accountDatabaseName(userId: String): String {
            val digest = MessageDigest.getInstance("SHA-256")
                .digest(userId.toByteArray(Charsets.UTF_8))
                .joinToString("") { byte -> "%02x".format(byte) }
                .take(20)
            return "bhaktichat_account_$digest.db"
        }

        /**
         * Hands an existing account-less database to the first account that signs in.
         *
         * Two sources, in priority order: the guest database (someone browsed anonymously,
         * then signed in to subscribe — their conversations must not vanish at the moment
         * they pay), then the pre-login database from before accounts existed.
         *
         * Only ever claims when the account has no database of its own, so signing back in
         * on a device that has since been used by a guest cannot overwrite real history.
         * Room has not been opened yet, so moving the file and its WAL sidecars is safe.
         */
        fun migrateLegacyDatabaseIfNeeded(context: Context, userId: String) {
            val targetName = accountDatabaseName(userId)
            if (context.getDatabasePath(targetName).exists()) return

            val sources = listOf(
                accountDatabaseName(guestUserId(context)),
                LEGACY_DATABASE_NAME
            )
            val sourceName = sources.firstOrNull { context.getDatabasePath(it).exists() } ?: return
            moveDatabase(context, from = sourceName, to = targetName)
        }

        private fun moveDatabase(context: Context, from: String, to: String) {
            context.getDatabasePath(to).parentFile?.mkdirs()
            listOf("", "-wal", "-shm").forEach { suffix ->
                val sourceFile = context.getDatabasePath(from + suffix)
                if (!sourceFile.exists()) return@forEach
                val targetFile = context.getDatabasePath(to + suffix)
                if (!sourceFile.renameTo(targetFile)) {
                    sourceFile.copyTo(targetFile, overwrite = false)
                    sourceFile.delete()
                }
            }
        }
    }
}
