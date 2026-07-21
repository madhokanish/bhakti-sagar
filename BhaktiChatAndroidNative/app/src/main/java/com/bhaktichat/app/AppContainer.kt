package com.bhaktichat.app

import android.content.Context
import androidx.room.Room
import com.bhaktichat.app.data.billing.SubscriptionManager
import com.bhaktichat.app.data.local.AppDatabase
import com.bhaktichat.app.data.local.SavedAartisStore
import com.bhaktichat.app.data.remote.ChatApi
import com.bhaktichat.app.data.remote.ChatApiClient
import com.bhaktichat.app.data.remote.DivineFeedbackClient
import com.bhaktichat.app.data.remote.DivineImageGenerator
import com.bhaktichat.app.data.remote.OkHttpChatApi
import com.bhaktichat.app.data.remote.PromptAwareChatApiClient
import com.bhaktichat.app.data.remote.RemoteDivineImageGenerator
import com.bhaktichat.app.data.repo.AartiRepository
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
import com.bhaktichat.app.util.AuthPreferences
import com.bhaktichat.app.util.BookmarkStore
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.GuidePreferences
import com.bhaktichat.app.util.ReviewPromptStore
import com.bhaktichat.app.util.StreakStore
import okhttp3.OkHttpClient
import okhttp3.JavaNetCookieJar
import java.net.CookieManager
import java.net.CookiePolicy
import java.util.concurrent.TimeUnit

class AppContainer(context: Context) {
    private val appContext = context.applicationContext
    private val cookieManager = CookieManager().apply {
        setCookiePolicy(CookiePolicy.ACCEPT_ORIGINAL_SERVER)
    }

    private val db: AppDatabase = Room.databaseBuilder(
        appContext,
        AppDatabase::class.java,
        "bhaktichat.db"
    )
        // Never silently wipe user data (threads + chat history) on an upgrade. With no
        // migration for a version bump, Room will now throw instead of destroying the DB,
        // forcing a real Migration to be added via .addMigrations(...) before release.
        // Destroying is only tolerated on a downgrade, which shouldn't reach production.
        .fallbackToDestructiveMigrationOnDowngrade()
        .build()

    // Bounded client for ordinary request/response calls (image, feedback, choghadiya).
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .cookieJar(JavaNetCookieJar(cookieManager))
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
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

    val guidePreferences = GuidePreferences(appContext)
    val authPreferences = AuthPreferences(appContext)
    val savedAartisStore = SavedAartisStore(appContext)
    val bookmarkStore = BookmarkStore(appContext)
    val entitlementStore = EntitlementStore(appContext)
    val streakStore = StreakStore(appContext)
    val reviewPromptStore = ReviewPromptStore(appContext)
    val subscriptionManager = SubscriptionManager(appContext, entitlementStore)
    val guidesRepository: GuidesRepository = DefaultGuidesRepository()
    val threadsRepository: ThreadsRepository = RoomThreadsRepository(db.threadDao())
    val messagesRepository: MessagesRepository = RoomMessagesRepository(db.messageDao())
    val chatApiClient: ChatApiClient = PromptAwareChatApiClient(chatApi)
    val chatRepository = ChatRepository(db.messageDao(), chatApi)
    val aartiRepository = AartiRepository(appContext)
    val choghadiyaRepository = ChoghadiyaRepository(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = httpClient
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
    val interstitialAdManager = com.bhaktichat.app.ui.components.ads.InterstitialAdManager()
}
