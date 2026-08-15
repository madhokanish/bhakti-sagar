package com.bhaktichat.app

import android.content.Context
import androidx.room.Room
import com.bhaktichat.app.data.auth.AuthRepository
import com.bhaktichat.app.data.autopay.UpiAutopayRepository
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
import com.bhaktichat.app.data.repo.ChatRepository
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
import com.bhaktichat.app.util.BookmarkStore
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.GuidePreferences
import com.bhaktichat.app.util.ReviewPromptStore
import com.bhaktichat.app.util.LanguageStore
import com.bhaktichat.app.util.StreakStore
import okhttp3.OkHttpClient
import okhttp3.JavaNetCookieJar
import java.net.CookieManager
import java.net.CookiePolicy
import java.security.MessageDigest
import java.util.concurrent.TimeUnit

class AppContainer(
    context: Context,
    val userId: String,
    private val authRepository: AuthRepository,
    val languageStore: LanguageStore
) {
    private val appContext = context.applicationContext
    private val cookieManager = CookieManager().apply {
        setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER)
    }

    private val databaseName = accountDatabaseName(userId)
    private val db: AppDatabase = Room.databaseBuilder(
        appContext,
        AppDatabase::class.java,
        databaseName
    )
        // Never silently wipe user data (threads + chat history) on an upgrade. With no
        // migration for a version bump, Room will now throw instead of destroying the DB,
        // forcing a real Migration to be added via .addMigrations(...) before release.
        // Destroying is only tolerated on a downgrade, which shouldn't reach production.
        .addMigrations(MIGRATION_3_4)
        .fallbackToDestructiveMigrationOnDowngrade()
        .build()

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
            }.build()
            chain.proceed(request)
        }
        .build()

    // Streaming chat holds the SSE connection open for the whole response, so it needs
    // no read timeout. Kept separate so a stalled non-streaming call can't hang forever.
    private val streamingHttpClient: OkHttpClient = httpClient.newBuilder()
        .readTimeout(0, TimeUnit.SECONDS)
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

    val guidePreferences = GuidePreferences(appContext)
    val savedAartisStore = SavedAartisStore(appContext)
    val bookmarkStore = BookmarkStore(appContext)
    val entitlementStore = EntitlementStore(appContext)
    val streakStore = StreakStore(appContext)
    val reviewPromptStore = ReviewPromptStore(appContext)
    val subscriptionManager = SubscriptionManager(appContext, entitlementStore, languageStore)

    // Chadhaava uses Razorpay's direct UPI AutoPay API. It returns a UPI mandate deep link,
    // which Android opens in the customer's chosen UPI app rather than in Razorpay Checkout.
    val upiAutopayRepository = UpiAutopayRepository(
        baseUrl = BuildConfig.API_BASE_URL,
        authRepository = authRepository,
        entitlementStore = entitlementStore
    )
    val guidesRepository: GuidesRepository = DefaultGuidesRepository()
    val threadsRepository: ThreadsRepository = RoomThreadsRepository(db.threadDao())
    val messagesRepository: MessagesRepository = RoomMessagesRepository(db.messageDao())
    val chatApiClient: ChatApiClient = PromptAwareChatApiClient(chatApi)
    val chatRepository = ChatRepository(db.messageDao(), chatApi)
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
    val aartiPlayerController = com.bhaktichat.app.playback.AartiPlayerController(appContext, languageStore)

    fun close() {
        aartiPlayerController.release()
        db.close()
    }

    companion object {
        private const val LEGACY_DATABASE_NAME = "bhaktichat.db"

        fun accountDatabaseName(userId: String): String {
            val digest = MessageDigest.getInstance("SHA-256")
                .digest(userId.toByteArray(Charsets.UTF_8))
                .joinToString("") { byte -> "%02x".format(byte) }
                .take(20)
            return "bhaktichat_account_$digest.db"
        }

        /**
         * Claims the pre-login database for the first account used after this upgrade.
         * Room has not been opened yet, so moving the database and its WAL sidecars is safe.
         */
        fun migrateLegacyDatabaseIfNeeded(context: Context, userId: String) {
            val targetName = accountDatabaseName(userId)
            val target = context.getDatabasePath(targetName)
            val legacy = context.getDatabasePath(LEGACY_DATABASE_NAME)
            if (target.exists() || !legacy.exists()) return

            target.parentFile?.mkdirs()
            listOf("", "-wal", "-shm").forEach { suffix ->
                val sourceFile = context.getDatabasePath(LEGACY_DATABASE_NAME + suffix)
                if (!sourceFile.exists()) return@forEach
                val targetFile = context.getDatabasePath(targetName + suffix)
                if (!sourceFile.renameTo(targetFile)) {
                    sourceFile.copyTo(targetFile, overwrite = false)
                    sourceFile.delete()
                }
            }
        }
    }
}
