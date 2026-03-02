package com.bhaktichat.app

import android.content.Context
import androidx.room.Room
import com.bhaktichat.app.data.local.AppDatabase
import com.bhaktichat.app.data.local.SavedAartisStore
import com.bhaktichat.app.data.remote.ChatApi
import com.bhaktichat.app.data.remote.OkHttpChatApi
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.data.repo.ChatRepository
import com.bhaktichat.app.data.repo.ChoghadiyaRepository
import com.bhaktichat.app.util.AuthPreferences
import com.bhaktichat.app.util.GuidePreferences
import okhttp3.OkHttpClient
import okhttp3.JavaNetCookieJar
import java.net.CookieManager
import java.net.CookiePolicy
import java.util.concurrent.TimeUnit

class AppContainer(context: Context) {
    private val appContext = context.applicationContext
    private val cookieManager = CookieManager().apply {
        setCookiePolicy(CookiePolicy.ACCEPT_ALL)
    }

    private val db: AppDatabase = Room.databaseBuilder(
        appContext,
        AppDatabase::class.java,
        "bhaktichat.db"
    ).fallbackToDestructiveMigration().build()

    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .cookieJar(JavaNetCookieJar(cookieManager))
        .connectTimeout(20, TimeUnit.SECONDS)
        .readTimeout(0, TimeUnit.SECONDS)
        .writeTimeout(20, TimeUnit.SECONDS)
        .build()

    private val chatApi: ChatApi = OkHttpChatApi(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = httpClient
    )

    val guidePreferences = GuidePreferences(appContext)
    val authPreferences = AuthPreferences(appContext)
    val savedAartisStore = SavedAartisStore(appContext)
    val chatRepository = ChatRepository(db.messageDao(), chatApi)
    val aartiRepository = AartiRepository(appContext)
    val choghadiyaRepository = ChoghadiyaRepository(
        baseUrl = BuildConfig.API_BASE_URL,
        httpClient = httpClient
    )
}
