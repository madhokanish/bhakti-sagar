import java.io.FileInputStream
import java.util.Properties

plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

// Release signing is read from keystore.properties (git-ignored) so credentials never
// enter version control. Copy keystore.properties.template → keystore.properties and fill
// it in. Without that file, release builds are simply left unsigned (still build fine).
val keystorePropertiesFile = rootProject.file("keystore.properties")
val keystoreProperties = Properties().apply {
    if (keystorePropertiesFile.exists()) load(FileInputStream(keystorePropertiesFile))
}

// PostHog analytics config is read from local.properties (git-ignored) so the project
// API key never enters version control. Add these lines to local.properties:
//   posthog.apiKey=phc_xxx
//   posthog.host=https://us.i.posthog.com   (or https://eu.i.posthog.com)
// If the key is absent, analytics initialization is simply skipped (no crash).
val localProperties = Properties().apply {
    val f = rootProject.file("local.properties")
    if (f.exists()) load(FileInputStream(f))
}
val webEnvironmentProperties = Properties().apply {
    val f = rootProject.file("../.env.local")
    if (f.exists()) load(FileInputStream(f))
}
val posthogApiKey: String = localProperties.getProperty("posthog.apiKey", "")
val posthogHost: String = localProperties.getProperty("posthog.host", "https://us.i.posthog.com")
// Web OAuth client ID used by Android Credential Manager to mint an ID token that the
// BhaktiChat backend can verify. This is intentionally the Web client, not Android client.
// Package/SHA Android client registrations are documented in
// ../docs/android-auth-release-checklist.md and must not be substituted here.
//   google.webClientId=1234-abc.apps.googleusercontent.com
val googleWebClientId: String =
    localProperties.getProperty("google.webClientId", "").trim()
        .ifBlank { System.getenv("ANDROID_GOOGLE_WEB_CLIENT_ID")?.trim().orEmpty() }
        .ifBlank { webEnvironmentProperties.getProperty("ANDROID_GOOGLE_WEB_CLIENT_ID", "").trim() }
        .ifBlank { webEnvironmentProperties.getProperty("GOOGLE_CLIENT_ID", "").trim() }

// AdMob config from local.properties (git-ignored):
//   admob.appId=ca-app-pub-XXXX~XXXX
//   admob.bannerId=ca-app-pub-XXXX/XXXX   (+ interstitialId / rewardedId)
// SAFETY: debug builds ALWAYS use Google's official TEST ad units (constants below) so
// development never loads/clicks your live units (which risks an invalid-traffic ban).
// Only RELEASE builds use your real ids. The App ID is not an impression source, so the
// real App ID is used for all build types.
val admobAppId: String = localProperties.getProperty("admob.appId", "ca-app-pub-3940256099942544~3347511713")
val admobBannerIdRelease: String = localProperties.getProperty("admob.bannerId", "ca-app-pub-3940256099942544/6300978111")
val admobInterstitialIdRelease: String = localProperties.getProperty("admob.interstitialId", "ca-app-pub-3940256099942544/1033173712")
val admobRewardedIdRelease: String = localProperties.getProperty("admob.rewardedId", "ca-app-pub-3940256099942544/5224354917")
// Google's universal test ad units — always safe.
val admobTestBannerId = "ca-app-pub-3940256099942544/6300978111"
val admobTestInterstitialId = "ca-app-pub-3940256099942544/1033173712"
val admobTestRewardedId = "ca-app-pub-3940256099942544/5224354917"

android {
    namespace = "com.bhaktichat.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.anish.bhaktichat"
        minSdk = 24
        targetSdk = 36
        versionCode = 32
        versionName = "2.8.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }

        // PostHog config surfaced to code via BuildConfig (values sourced from local.properties).
        buildConfigField("String", "POSTHOG_API_KEY", "\"$posthogApiKey\"")
        buildConfigField("String", "POSTHOG_HOST", "\"$posthogHost\"")
        buildConfigField("String", "GOOGLE_WEB_CLIENT_ID", "\"$googleWebClientId\"")

        // AdMob App ID → manifest (same for all build types). Ad-unit ids are set per
        // build type below (test in debug, real in release).
        manifestPlaceholders["admobAppId"] = admobAppId
    }

    signingConfigs {
        if (keystorePropertiesFile.exists()) {
            create("release") {
                storeFile = file(keystoreProperties.getProperty("storeFile"))
                storePassword = keystoreProperties.getProperty("storePassword")
                keyAlias = keystoreProperties.getProperty("keyAlias")
                keyPassword = keystoreProperties.getProperty("keyPassword")
            }
        }
    }

    buildTypes {
        debug {
            buildConfigField("String", "API_BASE_URL", "\"https://bhaktichat.com\"")
            // Always TEST ad units in debug — never touch live units during development.
            buildConfigField("String", "ADMOB_BANNER_ID", "\"$admobTestBannerId\"")
            buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"$admobTestInterstitialId\"")
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"$admobTestRewardedId\"")
        }
        release {
            // Signed only when keystore.properties is present; otherwise unsigned.
            if (keystorePropertiesFile.exists()) {
                signingConfig = signingConfigs.getByName("release")
            }
            isMinifyEnabled = true
            isShrinkResources = true
            buildConfigField("String", "API_BASE_URL", "\"https://bhaktichat.com\"")
            // Real ad units (from local.properties) only in release.
            buildConfigField("String", "ADMOB_BANNER_ID", "\"$admobBannerIdRelease\"")
            buildConfigField("String", "ADMOB_INTERSTITIAL_ID", "\"$admobInterstitialIdRelease\"")
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"$admobRewardedIdRelease\"")
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            // App has no native/NDK code of its own — this native code all comes from
            // third-party AARs (Google Mobile Ads, etc.). FULL packages their debug symbols
            // into the bundle so Play Console can symbolicate native crashes/ANRs.
            ndk {
                debugSymbolLevel = "FULL"
            }
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

// A release with an empty or malformed Web OAuth client ID can install normally but
// every Google sign-in attempt will fail. Keep debug builds available for local UI work,
// while making the Play-bound release fail loudly before compilation/package work begins.
val validateGoogleWebClientId by tasks.registering {
    group = "verification"
    description = "Checks that Google sign-in is configured for release builds."
    doLast {
        check(
            googleWebClientId.matches(
                Regex("""^\d+-[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$""")
            )
        ) {
            "Missing or invalid Google Web OAuth client ID. Set google.webClientId in " +
                "BhaktiChatAndroidNative/local.properties or ANDROID_GOOGLE_WEB_CLIENT_ID " +
                "before building a release."
        }
    }
}

tasks.matching { it.name == "preReleaseBuild" }.configureEach {
    dependsOn(validateGoogleWebClientId)
}

kotlin {
    compilerOptions {
        jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_17)
    }
}

// Export Room schemas so future version bumps can be migrated (and verified) instead of
// destroying the database. Generated under app/schemas/.
ksp {
    arg("room.schemaLocation", "$projectDir/schemas")
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(libs.coroutines.android)
    implementation("com.google.android.material:material:1.12.0")

    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons)
    implementation(libs.androidx.compose.navigation)

    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    implementation(libs.billing.ktx)

    // Razorpay Checkout — UPI AutoPay mandate registration for चढ़ावा.
    implementation(libs.razorpay.checkout)
    // Chrome Custom Tabs — hosts Razorpay's checkout page in-app.
    implementation(libs.androidx.browser)

    implementation(libs.posthog.android)

    implementation(libs.play.services.ads)
    implementation(libs.user.messaging.platform)
    implementation(libs.play.review.ktx)
    implementation(libs.androidx.lifecycle.process)
    implementation(libs.androidx.credentials)
    implementation(libs.androidx.credentials.play.services.auth)
    implementation(libs.googleid)
    implementation(libs.youtube.player.core)
    implementation(libs.media3.exoplayer)
    implementation(libs.media3.session)
    implementation(libs.media3.ui)

    implementation(libs.okhttp)
    implementation("com.squareup.okhttp3:okhttp-urlconnection:4.12.0")
    implementation(libs.moshi.kotlin)
    testImplementation("junit:junit:4.13.2")

    debugImplementation(platform(libs.androidx.compose.bom))
    debugImplementation("androidx.compose.ui:ui-tooling")
}
