package com.bhaktichat.app.ui.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.bhaktichat.app.AppContainer
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.MessageStatus
import com.bhaktichat.app.ui.components.ads.findActivity
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBar
import com.bhaktichat.app.ui.screens.aartis.AartiDetailScreen
import com.bhaktichat.app.ui.screens.aartis.AartisScreen
import com.bhaktichat.app.ui.screens.bhaktichat.BhaktiChatHubScreen
import com.bhaktichat.app.ui.screens.bhaktichat.BhaktiChatHubViewModel
import com.bhaktichat.app.ui.screens.bhaktichat.BhaktiChatHubViewModelFactory
import com.bhaktichat.app.ui.screens.chat.ChatThreadScreen
import com.bhaktichat.app.ui.screens.chat.ChatThreadViewModel
import com.bhaktichat.app.ui.screens.chat.ChatThreadViewModelFactory
import com.bhaktichat.app.ui.screens.chat.ChatConversationState
import com.bhaktichat.app.ui.screens.chat.ChatTurnProcessor
import com.bhaktichat.app.ui.screens.voice.VoiceConversationViewModel
import com.bhaktichat.app.ui.screens.voice.VoiceConversationViewModelFactory
import com.bhaktichat.app.ui.screens.voice.VoiceModeScreen
import com.bhaktichat.app.util.VoiceAudioFocusManager
import com.bhaktichat.app.ui.screens.choghadiya.ChoghadiyaRoute
import com.bhaktichat.app.ui.screens.choghadiya.ChoghadiyaViewModel
import com.bhaktichat.app.ui.screens.choghadiya.ChoghadiyaViewModelFactory
import com.bhaktichat.app.ui.screens.discovery.HomeScreen
import com.bhaktichat.app.ui.screens.divineimage.DivineImageCreateScreen
import com.bhaktichat.app.ui.screens.divineimage.DivineImageCreateViewModel
import com.bhaktichat.app.ui.screens.divineimage.DivineImageCreateViewModelFactory
import com.bhaktichat.app.ui.screens.divineimage.DivineImageHomeViewModel
import com.bhaktichat.app.ui.screens.divineimage.DivineImageHomeViewModelFactory
import com.bhaktichat.app.ui.screens.divineimage.DivineImageResultScreen
import com.bhaktichat.app.ui.screens.divineimage.DivineImageResultViewModel
import com.bhaktichat.app.ui.screens.divineimage.DivineImageResultViewModelFactory
import com.bhaktichat.app.ui.screens.divineimage.DivineImageScreen
import com.bhaktichat.app.ui.screens.explore.ExploreScreen
import com.bhaktichat.app.ui.screens.explore.FestivalsScreen
import com.bhaktichat.app.ui.screens.explore.PanchangScreen
import com.bhaktichat.app.ui.screens.explore.WallpaperDetailScreen
import com.bhaktichat.app.ui.screens.explore.WallpapersScreen
import com.bhaktichat.app.ui.screens.guidepicker.GuidePickerScreen
import com.bhaktichat.app.ui.screens.history.HistoryRoute
import com.bhaktichat.app.ui.screens.history.HistoryViewModelFactory
import com.bhaktichat.app.ui.screens.profile.ProfileScreen
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.AnonUserKey
import com.bhaktichat.app.util.EntitlementStore
import kotlinx.coroutines.launch
import java.util.UUID

@Composable
fun BhaktiChatApp() {
    val context = LocalContext.current
    val appContainer = (context.applicationContext as BhaktiChatApplication).container
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val route = backStack?.destination?.route.orEmpty()
    val density = LocalDensity.current
    val imeVisible = WindowInsets.ime.getBottom(density) > 0
    val showBottomBar = shouldShowBottomBar(route = route, imeVisible = imeVisible)
    val authState by appContainer.authPreferences.state.collectAsStateWithLifecycle()
    val entitlementStore = appContainer.entitlementStore
    // Ad-model: [isPro] no longer gates anything; kept only so grandfathered subscribers
    // are still recognized (see EntitlementStore REVIEW note). Paywall removed.
    val isPro by entitlementStore.isPro.collectAsStateWithLifecycle()
    val streak by appContainer.streakStore.currentStreak.collectAsStateWithLifecycle()
    val longestStreak by appContainer.streakStore.longestStreak.collectAsStateWithLifecycle()
    val isStreakBannerDismissed by appContainer.streakStore.isBannerDismissedToday.collectAsStateWithLifecycle()
    val shouldShowReviewPrompt by appContainer.reviewPromptStore.shouldShowPrompt.collectAsStateWithLifecycle()
    val appScope = rememberCoroutineScope()

    // Record the daily-darshan streak on open. (Intro upsell removed — ad-based model.)
    LaunchedEffect(Unit) {
        appContainer.streakStore.recordVisit()
    }

    // Analytics: one screen view per navigation route change (single-Activity app, so
    // the PostHog SDK's Activity-level capture can't see Compose routes).
    LaunchedEffect(route) {
        if (route.isNotBlank()) Analytics.screen(route)
    }

    fun navigateToTopLevel(destination: String) {
        val targetRoute = when (destination) {
            NavDestinations.BHAKTI_CHAT_BASE -> NavDestinations.bhaktiChatRoute()
            else -> destination
        }
        val currentRoute = navController.currentBackStackEntry?.destination?.route.orEmpty()
        if (destination == NavDestinations.HOME) {
            if (currentRoute == NavDestinations.HOME) return
            if (!navController.popBackStack(NavDestinations.HOME, inclusive = false)) {
                navController.navigate(NavDestinations.HOME) {
                    launchSingleTop = true
                    restoreState = false
                }
            }
            return
        }
        navController.navigate(targetRoute) {
            popUpTo(navController.graph.findStartDestination().id) {
                saveState = true
            }
            launchSingleTop = true
            restoreState = true
        }
    }

    fun launchThread(
        guideId: String,
        initialPrompt: String? = null,
        includeOpener: Boolean,
        popUpRoute: String? = null
    ) {
        // Ad-model: chat is free for everyone — no quota gate here.
        appScope.launch {
            val guide = appContainer.guidesRepository.getGuide(guideId) ?: return@launch
            Analytics.guideSelected(guideId = guide.id)
            val thread = appContainer.threadsRepository.createThread(guide.id)
            val now = System.currentTimeMillis()
            var typingMessageId: String? = null

            if (includeOpener) {
                appContainer.messagesRepository.addMessage(
                    MessageEntity(
                        id = UUID.randomUUID().toString(),
                        threadId = thread.id,
                        guideId = guide.id,
                        role = ChatRole.ASSISTANT.wire,
                        content = guide.openingScene,
                        createdAt = now,
                        status = MessageStatus.SENT.name
                    )
                )
                appContainer.threadsRepository.touchThread(thread.id, now)
            }

            if (!initialPrompt.isNullOrBlank()) {
                val userMessage = MessageEntity(
                    id = UUID.randomUUID().toString(),
                    threadId = thread.id,
                    guideId = guide.id,
                    role = ChatRole.USER.wire,
                    content = initialPrompt.trim(),
                    createdAt = now + if (includeOpener) 1 else 0,
                    status = MessageStatus.SENDING.name
                )
                appContainer.messagesRepository.addMessage(userMessage)
                appContainer.messagesRepository.updateMessageStatus(userMessage.id, MessageStatus.SENT)

                val typingMessage = MessageEntity(
                    id = UUID.randomUUID().toString(),
                    threadId = thread.id,
                    guideId = guide.id,
                    role = ChatRole.ASSISTANT.wire,
                    content = "",
                    createdAt = userMessage.createdAt + 1,
                    status = MessageStatus.SENT.name,
                    isTypingIndicator = true
                )
                appContainer.messagesRepository.addMessage(typingMessage)
                appContainer.threadsRepository.touchThread(thread.id, typingMessage.createdAt)
                typingMessageId = typingMessage.id
            }

            navController.navigate(NavDestinations.threadRoute(thread.id)) {
                if (!popUpRoute.isNullOrBlank()) {
                    popUpTo(popUpRoute) { inclusive = true }
                }
            }

            if (typingMessageId != null) {
                val typingId = typingMessageId
                val sendResult = ChatTurnProcessor.generateReply(
                    threadId = thread.id,
                    guide = guide,
                    messageText = initialPrompt.orEmpty(),
                    messages = appContainer.messagesRepository
                        .listMessages(thread.id)
                        .filterNot { it.isTypingIndicator },
                    authState = authState,
                    currentState = ChatConversationState(),
                    remoteConversationId = null,
                    chatApiClient = appContainer.chatApiClient,
                    onToken = { streamed ->
                        appContainer.messagesRepository.replaceTypingWithResponse(typingId, streamed)
                    }
                )
                if (sendResult.exceptionOrNull() is com.bhaktichat.app.data.remote.ChatLimitReachedException) {
                    // Server free-limit reached → remove the pending bubble and show the
                    // non-skippable Pro gate.
                    appContainer.messagesRepository.removeMessage(typingId)
                    entitlementStore.markChatLimitReached()
                    return@launch
                }
                val response = sendResult.getOrNull()?.replyText
                    ?: "I am reflecting upon your question. Please try again in a moment."
                appContainer.messagesRepository.replaceTypingWithResponse(typingId, response)
                val updatedAt = System.currentTimeMillis()
                appContainer.threadsRepository.touchThread(thread.id, updatedAt)
                sendResult.getOrNull()?.let { result ->
                    appContainer.threadsRepository.updateConversationState(
                        threadId = thread.id,
                        updatedAt = updatedAt,
                        remoteConversationId = result.conversationId,
                        statePayload = result.nextState.toStateAnchorJson()
                    )
                    // Only burn quota on a successful assistant reply — failures
                    // and empty results do not count toward the free tier.
                    entitlementStore.recordMessageSent()
                    appContainer.reviewPromptStore.recordMessageSent()
                    Analytics.chatMessageSent(guideId = guide.id)
                }
            }
        }
    }

    // Paywall removed (ad-based model). Features are free for all users.

    if (shouldShowReviewPrompt) {
        ReviewPromptDialog(
            onEnjoying = {
                appContainer.reviewPromptStore.markPromptAccepted()
                openPlayStoreListing(context)
            },
            onNotNow = { appContainer.reviewPromptStore.markPromptDismissed() }
        )
    }

    androidx.compose.material3.Scaffold(
        containerColor = androidx.compose.material3.MaterialTheme.colorScheme.background,
        bottomBar = {
            if (showBottomBar) {
                BhaktiBottomNavBar(
                    currentRoute = route,
                    onNavigate = ::navigateToTopLevel
                )
            }
        }
    ) { paddingValues ->
        NavHost(
            navController = navController,
            startDestination = NavDestinations.HOME,
            modifier = Modifier.padding(paddingValues),
            enterTransition = { fadeIn(animationSpec = tween(durationMillis = 220)) },
            exitTransition = { fadeOut(animationSpec = tween(durationMillis = 180)) },
            popEnterTransition = { fadeIn(animationSpec = tween(durationMillis = 220)) },
            popExitTransition = { fadeOut(animationSpec = tween(durationMillis = 180)) }
        ) {
            composable(NavDestinations.HOME) {
                HomeScreen(
                    onOpenProfile = { navController.navigate(NavDestinations.PROFILE) },
                    onStartGuidedThread = { guideId, prompt, skipOpener ->
                        launchThread(
                            guideId = guideId,
                            initialPrompt = prompt,
                            includeOpener = !skipOpener
                        )
                    },
                    onOpenGuideThread = { guideId ->
                        launchThread(
                            guideId = guideId,
                            includeOpener = true
                        )
                    },
                    onOpenGuidePicker = { navController.navigate(NavDestinations.GUIDE_PICKER) },
                    onOpenAartis = { navController.navigate(NavDestinations.AARTIS) },
                    onOpenChoghadiya = {
                        Analytics.choghadiyaOpened()
                        navController.navigate(NavDestinations.CHOGHADIYA)
                    },
                    onOpenSubscribe = { entitlementStore.presentManually() },
                    onOpenDivineImage = { navController.navigate(NavDestinations.DIVINE_IMAGE_HOME) },
                    userName = authState.name,
                    streak = streak,
                    longestStreak = longestStreak,
                    isStreakBannerDismissed = isStreakBannerDismissed,
                    onDismissStreakBanner = { appContainer.streakStore.dismissBannerForToday() },
                    // Full darshan-streak view is future work; row is tappable but no-ops for now.
                    onOpenStreak = { },
                    isPro = isPro
                )
            }

            composable(
                route = NavDestinations.BHAKTI_CHAT,
                arguments = listOf(
                    navArgument(NavDestinations.HUB_GUIDE_ARG) {
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { entry ->
                val vm: BhaktiChatHubViewModel = viewModel(
                    factory = BhaktiChatHubViewModelFactory(
                        guidesRepository = appContainer.guidesRepository,
                        threadsRepository = appContainer.threadsRepository,
                        messagesRepository = appContainer.messagesRepository,
                        chatApiClient = appContainer.chatApiClient,
                        authPreferences = appContainer.authPreferences,
                        entitlementStore = entitlementStore,
                        reviewPromptStore = appContainer.reviewPromptStore,
                        initialGuideId = entry.arguments?.getString(NavDestinations.HUB_GUIDE_ARG)
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()

                BhaktiChatHubScreen(
                    uiState = uiState,
                    uiEvents = vm.uiEvents,
                    onOpenProfile = { navController.navigate(NavDestinations.PROFILE) },
                    onSelectGuide = vm::selectGuide,
                    onInputChange = vm::onInputChanged,
                    onStartThreadFromChip = vm::startThreadFromChip,
                    onStartThreadFromInput = vm::startThreadFromInput,
                    onOpenThread = { threadId ->
                        navController.navigate(NavDestinations.threadRoute(threadId))
                    },
                    isPro = isPro,
                    onOpenSubscribe = { entitlementStore.presentManually() }
                )
            }

            composable(
                route = NavDestinations.THREAD,
                arguments = listOf(navArgument(NavDestinations.THREAD_ID_ARG) { type = NavType.StringType })
            ) { entry ->
                val threadId = entry.arguments?.getString(NavDestinations.THREAD_ID_ARG).orEmpty()
                val vm: ChatThreadViewModel = viewModel(
                    key = "thread_$threadId",
                    factory = ChatThreadViewModelFactory(
                        threadId = threadId,
                        guidesRepository = appContainer.guidesRepository,
                        threadsRepository = appContainer.threadsRepository,
                        messagesRepository = appContainer.messagesRepository,
                        chatApiClient = appContainer.chatApiClient,
                        authPreferences = appContainer.authPreferences,
                        entitlementStore = entitlementStore,
                        reviewPromptStore = appContainer.reviewPromptStore
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                ChatThreadScreen(
                    uiState = uiState,
                    onBack = {
                        if (!navController.popBackStack(NavDestinations.BHAKTI_CHAT_BASE, inclusive = false)) {
                            navController.navigate(NavDestinations.BHAKTI_CHAT_BASE) {
                                launchSingleTop = true
                            }
                        }
                    },
                    onInputChange = vm::onInputChanged,
                    onSend = vm::sendMessage,
                    onRegenerate = vm::regenerateLastReply,
                    onOpenVoiceMode = { guideId, conversationId ->
                        navController.navigate(NavDestinations.voiceModeRoute(guideId, conversationId))
                    }
                )
            }

            composable(
                route = NavDestinations.VOICE_MODE,
                arguments = listOf(
                    navArgument(NavDestinations.VOICE_MODE_GUIDE_ARG) { type = NavType.StringType },
                    navArgument(NavDestinations.VOICE_MODE_CONVERSATION_ARG) {
                        type = NavType.StringType
                        nullable = true
                    }
                )
            ) { entry ->
                val guideId = entry.arguments?.getString(NavDestinations.VOICE_MODE_GUIDE_ARG).orEmpty()
                val conversationId = entry.arguments?.getString(NavDestinations.VOICE_MODE_CONVERSATION_ARG)
                val guide = appContainer.guidesRepository.getGuide(guideId)
                if (guide == null) {
                    LaunchedEffect(Unit) { navController.popBackStack() }
                } else {
                    val vm: VoiceConversationViewModel = viewModel(
                        key = "voice_$guideId",
                        factory = VoiceConversationViewModelFactory(
                            guide = guide,
                            conversationId = conversationId,
                            voiceSessionApi = appContainer.voiceSessionApi,
                            voiceWebSocketClient = appContainer.voiceWebSocketClient,
                            audioFocusManager = VoiceAudioFocusManager(LocalContext.current)
                        )
                    )
                    VoiceModeScreen(
                        viewModel = vm,
                        onBack = { navController.popBackStack() }
                    )
                }
            }

            composable(NavDestinations.DIVINE_IMAGE_HOME) {
                val vm: DivineImageHomeViewModel = viewModel(
                    factory = DivineImageHomeViewModelFactory(
                        templateRepository = appContainer.divineTemplateRepository,
                        creationRepository = appContainer.divineCreationRepository
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                DivineImageScreen(
                    uiState = uiState,
                    onBack = { navController.popBackStack() },
                    onOpenHistory = { navController.navigate(NavDestinations.HISTORY) },
                    onOpenCreation = { creationId ->
                        navController.navigate(NavDestinations.divineImageResultRoute(creationId))
                    },
                    onOpenTemplate = { mode, templateId ->
                        navController.navigate(
                            NavDestinations.divineImageCreateRoute(
                                mode = mode.name,
                                templateId = templateId
                            )
                        )
                    },
                    isPro = isPro,
                    onOpenSubscribe = { entitlementStore.presentManually() }
                )
            }

            composable(NavDestinations.EXPLORE) {
                ExploreScreen(
                    onOpenProfile = { navController.navigate(NavDestinations.PROFILE) },
                    onOpenDivineImage = { navController.navigate(NavDestinations.DIVINE_IMAGE_HOME) },
                    onOpenAartis = { navController.navigate(NavDestinations.AARTIS) },
                    onOpenChoghadiya = {
                        Analytics.choghadiyaOpened()
                        navController.navigate(NavDestinations.CHOGHADIYA)
                    },
                    onOpenFestivals = { navController.navigate(NavDestinations.FESTIVALS) },
                    onOpenPanchang = { navController.navigate(NavDestinations.PANCHANG) },
                    onOpenWallpapers = { navController.navigate(NavDestinations.WALLPAPERS) }
                )
            }

            composable(NavDestinations.FESTIVALS) {
                FestivalsScreen(onBack = { navController.popBackStack() })
            }

            composable(NavDestinations.PANCHANG) {
                PanchangScreen(onBack = { navController.popBackStack() })
            }

            composable(NavDestinations.WALLPAPERS) {
                WallpapersScreen(
                    onBack = { navController.popBackStack() },
                    onOpenWallpaper = { wallpaperId ->
                        navController.navigate(NavDestinations.wallpaperDetailRoute(wallpaperId))
                    }
                )
            }

            composable(
                route = NavDestinations.WALLPAPER_DETAIL,
                arguments = listOf(navArgument("wallpaperId") { type = NavType.StringType })
            ) { backStackEntry ->
                val wallpaperId = backStackEntry.arguments?.getString("wallpaperId").orEmpty()
                WallpaperDetailScreen(
                    wallpaperId = wallpaperId,
                    onBack = { navController.popBackStack() }
                )
            }

            composable(
                route = NavDestinations.DIVINE_IMAGE_CREATE,
                arguments = listOf(
                    navArgument(NavDestinations.DIVINE_IMAGE_MODE_ARG) { type = NavType.StringType },
                    navArgument(NavDestinations.DIVINE_IMAGE_TEMPLATE_ID_ARG) { type = NavType.StringType }
                )
            ) { entry ->
                val mode = runCatching {
                    DivineMode.valueOf(
                        entry.arguments?.getString(NavDestinations.DIVINE_IMAGE_MODE_ARG).orEmpty()
                    )
                }.getOrDefault(DivineMode.PHOTO_WITH_GOD)
                val templateId = entry.arguments
                    ?.getString(NavDestinations.DIVINE_IMAGE_TEMPLATE_ID_ARG)
                    .orEmpty()
                val vm: DivineImageCreateViewModel = viewModel(
                    key = "divine_create_${mode.name}_$templateId",
                    factory = DivineImageCreateViewModelFactory(
                        mode = mode,
                        templateId = templateId,
                        templateRepository = appContainer.divineTemplateRepository,
                        creationRepository = appContainer.divineCreationRepository,
                        generator = appContainer.divineImageGenerator,
                        entitlementStore = entitlementStore
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                val localContext = LocalContext.current
                DivineImageCreateScreen(
                    mode = mode,
                    uiState = uiState,
                    uiEvents = vm.uiEvents,
                    onBack = {
                        if (!navController.popBackStack(NavDestinations.DIVINE_IMAGE_HOME, inclusive = false)) {
                            navController.navigate(NavDestinations.DIVINE_IMAGE_HOME) {
                                launchSingleTop = true
                            }
                        }
                    },
                    onOpenResult = { creationId ->
                        navController.navigate(NavDestinations.divineImageResultRoute(creationId))
                    },
                    onPickImage = vm::pickImage,
                    onUseDemoPhoto = {
                        vm.pickImage(
                            DivineImageCreateViewModel.defaultDemoPhotoUri(
                                packageName = localContext.packageName
                            )
                        )
                    },
                    onCustomTempleNameChange = vm::onCustomTempleNameChanged,
                    onSelectDeity = vm::selectDeity,
                    onSelectScene = vm::selectScene,
                    onSelectTemple = vm::selectTemple,
                    onSelectTempleMoment = vm::selectTempleMoment,
                    onCustomPromptChange = vm::onCustomPromptChanged,
                    onGenerate = vm::generate
                )
            }

            composable(
                route = NavDestinations.DIVINE_IMAGE_RESULT,
                arguments = listOf(
                    navArgument(NavDestinations.DIVINE_IMAGE_CREATION_ID_ARG) { type = NavType.StringType }
                )
            ) { entry ->
                val creationId = entry.arguments
                    ?.getString(NavDestinations.DIVINE_IMAGE_CREATION_ID_ARG)
                    .orEmpty()
                val vm: DivineImageResultViewModel = viewModel(
                    key = "divine_result_$creationId",
                    factory = DivineImageResultViewModelFactory(
                        creationId = creationId,
                        templateRepository = appContainer.divineTemplateRepository,
                        creationRepository = appContainer.divineCreationRepository,
                        generator = appContainer.divineImageGenerator,
                        feedbackClient = appContainer.divineFeedbackClient,
                        anonUserKey = AnonUserKey.get(context)
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                DivineImageResultScreen(
                    uiState = uiState,
                    uiEvents = vm.uiEvents,
                    onBack = {
                        if (!navController.popBackStack(NavDestinations.DIVINE_IMAGE_HOME, inclusive = false)) {
                            navController.navigate(NavDestinations.DIVINE_IMAGE_HOME) {
                                launchSingleTop = true
                            }
                        }
                    },
                    onBackToHome = {
                        if (!navController.popBackStack(NavDestinations.DIVINE_IMAGE_HOME, inclusive = false)) {
                            navController.navigate(NavDestinations.DIVINE_IMAGE_HOME) {
                                launchSingleTop = true
                            }
                        }
                    },
                    onCancel = vm::cancel,
                    onRegenerate = vm::regenerate,
                    onSave = vm::save,
                    onShareToInstagram = vm::shareToInstagram,
                    onShareToWhatsApp = vm::shareToWhatsApp,
                    onShareWithSystem = vm::share,
                    onFeedback = vm::onFeedback
                )
            }

            composable(NavDestinations.HISTORY) {
                HistoryRoute(
                    factory = HistoryViewModelFactory(
                        threadsRepository = appContainer.threadsRepository,
                        messagesRepository = appContainer.messagesRepository,
                        guidesRepository = appContainer.guidesRepository,
                        creationRepository = appContainer.divineCreationRepository,
                        bookmarkStore = appContainer.bookmarkStore,
                        aartiRepository = appContainer.aartiRepository
                    ),
                    bookmarkStore = appContainer.bookmarkStore,
                    onOpenProfile = { navController.navigate(NavDestinations.PROFILE) },
                    onOpenThread = { threadId ->
                        navController.navigate(NavDestinations.threadRoute(threadId))
                    },
                    onOpenCreation = { creationId ->
                        navController.navigate(NavDestinations.divineImageResultRoute(creationId))
                    }
                )
            }

            composable(NavDestinations.GUIDE_PICKER) {
                GuidePickerScreen(onGuideClick = { guideId ->
                    launchThread(
                        guideId = guideId,
                        includeOpener = true,
                        popUpRoute = NavDestinations.GUIDE_PICKER
                    )
                })
            }

            composable(NavDestinations.AARTIS) {
                AartisScreen(
                    repository = appContainer.aartiRepository,
                    savedAartisStore = appContainer.savedAartisStore,
                    onBack = {
                        if (!navController.popBackStack(NavDestinations.HOME, inclusive = false)) {
                            navController.navigate(NavDestinations.HOME) {
                                launchSingleTop = true
                            }
                        }
                    },
                    onOpenDetail = { aartiId ->
                        Analytics.aartiOpened(aartiId = aartiId)
                        navController.navigate(NavDestinations.aartiDetailRoute(aartiId))
                    }
                )
            }

            composable(
                route = NavDestinations.AARTI_DETAIL,
                arguments = listOf(navArgument("aartiId") { type = NavType.StringType })
            ) { entry ->
                val aartiId = entry.arguments?.getString("aartiId").orEmpty()
                AartiDetailScreen(
                    aartiId = aartiId,
                    repository = appContainer.aartiRepository,
                    onBack = { navController.popBackStack() },
                    onAskKrishna = { prefill ->
                        launchThread(
                            guideId = "krishna",
                            initialPrompt = prefill,
                            includeOpener = false
                        )
                    }
                )
            }

            composable(NavDestinations.CHOGHADIYA) {
                val vm: ChoghadiyaViewModel = viewModel(
                    factory = ChoghadiyaViewModelFactory(appContainer.choghadiyaRepository)
                )
                ChoghadiyaRoute(
                    viewModel = vm,
                    onBack = {
                        if (!navController.popBackStack(NavDestinations.HOME, inclusive = false)) {
                            navController.navigate(NavDestinations.HOME) {
                                launchSingleTop = true
                            }
                        }
                    },
                    onAskShani = { prompt ->
                        launchThread(
                            guideId = "shani",
                            initialPrompt = prompt,
                            includeOpener = false
                        )
                    }
                )
            }

            composable(NavDestinations.PROFILE) {
                ProfileScreen(
                    authState = authState,
                    onBack = { navController.popBackStack() },
                    onSignIn = { name, email, photoUrl ->
                        appContainer.authPreferences.signIn(name, email, photoUrl)
                    },
                    onSignOut = {
                        appContainer.authPreferences.signOut()
                    }
                )
            }
        }
    }
}

/**
 * Custom pre-prompt for ratings. Tapping "Yes" opens the Play Store listing directly (see
 * [openPlayStoreListing]) so the user can rate — the previous Play In-App Review API silently
 * no-op'd and never opened the store. See [com.bhaktichat.app.util.ReviewPromptStore] for the
 * trigger/cadence logic.
 */
@Composable
private fun ReviewPromptDialog(onEnjoying: () -> Unit, onNotNow: () -> Unit) {
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onNotNow,
        title = { androidx.compose.material3.Text("Enjoying BhaktiChat? 🙏") },
        text = {
            androidx.compose.material3.Text(
                "If BhaktiChat has been helpful, a quick rating helps other seekers find it too."
            )
        },
        confirmButton = {
            androidx.compose.material3.TextButton(onClick = onEnjoying) {
                androidx.compose.material3.Text("Yes, I love it!")
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onNotNow) {
                androidx.compose.material3.Text("Not now")
            }
        }
    )
}

/**
 * Opens the app's Play Store listing so the user can leave a rating/review. Prefers the Play
 * Store app (market:// + explicit vending package); falls back to the browser if the Play
 * Store app isn't available. Unlike the In-App Review API, this reliably takes the user to the
 * store — which is what "Yes, I love it!" should do.
 */
private fun openPlayStoreListing(context: android.content.Context) {
    val pkg = context.packageName
    val marketIntent = android.content.Intent(
        android.content.Intent.ACTION_VIEW,
        android.net.Uri.parse("market://details?id=$pkg")
    ).apply {
        setPackage("com.android.vending")
        addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
    }
    runCatching { context.startActivity(marketIntent) }.onFailure {
        runCatching {
            context.startActivity(
                android.content.Intent(
                    android.content.Intent.ACTION_VIEW,
                    android.net.Uri.parse("https://play.google.com/store/apps/details?id=$pkg")
                ).addFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK)
            )
        }
    }
}

private fun shouldShowBottomBar(route: String, imeVisible: Boolean): Boolean {
    if (imeVisible) return false
    // Visible on the 4 tab roots + Explore sub-lists + the Divine Image landing.
    // Hidden on focused flows: chat thread, profile, and Divine create/generating/result.
    return route == NavDestinations.HOME ||
        route.startsWith(NavDestinations.BHAKTI_CHAT_ROUTE_PREFIX) ||
        route == NavDestinations.EXPLORE ||
        route == NavDestinations.AARTIS ||
        route.startsWith("aarti/") ||
        route == NavDestinations.CHOGHADIYA ||
        route == NavDestinations.FESTIVALS ||
        route == NavDestinations.PANCHANG ||
        route == NavDestinations.WALLPAPERS ||
        route == NavDestinations.DIVINE_IMAGE_HOME ||
        route == NavDestinations.HISTORY
}
