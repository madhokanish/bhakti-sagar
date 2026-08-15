package com.bhaktichat.app.ui.navigation
import com.bhaktichat.app.domain.displayTitle
import com.bhaktichat.app.domain.displayCaption
import com.bhaktichat.app.ui.i18n.t

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.R
import kotlinx.coroutines.delay
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
import com.bhaktichat.app.data.auth.MobileUser
import com.bhaktichat.app.data.local.MessageEntity
import com.bhaktichat.app.domain.ChatRole
import com.bhaktichat.app.domain.MessageStatus
import com.bhaktichat.app.ui.components.ads.findActivity
import com.bhaktichat.app.ui.components.shell.BhaktiBottomNavBar
import com.bhaktichat.app.ui.screens.aartis.AartiDetailScreen
import com.bhaktichat.app.ui.screens.aartis.AartiNowPlayingScreen
import com.bhaktichat.app.ui.screens.aartis.AartisScreen
import com.bhaktichat.app.ui.screens.chadhaava.BlockedFeature
import com.bhaktichat.app.ui.screens.chadhaava.ChadhaavaScreen
import com.bhaktichat.app.ui.screens.chadhaava.ChadhaavaViewModel
import com.bhaktichat.app.ui.screens.chadhaava.ChadhaavaViewModelFactory
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
import com.bhaktichat.app.ui.screens.reels.ReelsScreen
import com.bhaktichat.app.ui.screens.reels.ReelsViewModelFactory
import com.bhaktichat.app.domain.DivineMode
import com.bhaktichat.app.util.Analytics
import com.bhaktichat.app.util.AnonUserKey
import com.bhaktichat.app.util.EntitlementStore
import com.bhaktichat.app.util.AdsConsentManager
import kotlinx.coroutines.launch
import java.util.UUID

@Composable
fun BhaktiChatApp(
    appContainer: AppContainer,
    currentUser: MobileUser,
    onSignOut: suspend () -> Unit,
    onDeleteAccount: suspend () -> Result<Unit>
) {
    val context = LocalContext.current

    // Server of record for the interface language. Collected as state so that changing it
    // recomposes every t() call site in the tree at once — no restart, no re-navigation.
    val language by appContainer.languageStore.language.collectAsStateWithLifecycle()

    androidx.compose.runtime.CompositionLocalProvider(
        com.bhaktichat.app.ui.i18n.LocalAppLanguage provides language
    ) {

    // Asked once, on first launch after sign-in — including for existing users, who have
    // been on Hindi by fiat until now and have never been offered the choice.
    var languageChosen by rememberSaveable {
        mutableStateOf(appContainer.languageStore.hasChosenLanguage)
    }
    if (!languageChosen) {
        com.bhaktichat.app.ui.components.language.LanguagePickerSheet(
            current = null,
            onSelect = { picked ->
                appContainer.languageStore.setLanguage(picked)
                languageChosen = true
            }
        )
    }

    // Resolved in composition — used below inside coroutines/lambdas.
    val thinkingFallback = t("chat_thinking_fallback")
    val reelAskPrefix = t("reel_ask_prefix")
    val reelAskMeaning = t("reel_ask_meaning")

    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val route = backStack?.destination?.route.orEmpty()
    val density = LocalDensity.current
    val imeVisible = WindowInsets.ime.getBottom(density) > 0
    val showBottomBar = shouldShowBottomBar(route = route, imeVisible = imeVisible)
    val entitlementStore = appContainer.entitlementStore
    // Entitlement is server truth (Razorpay/Chadhaava), mirrored locally by
    // SubscriptionRepository. Grandfathered Play subscribers also read true here.
    val isPro by entitlementStore.isPro.collectAsStateWithLifecycle()

    /**
     * Wallpapers is the one feature gated behind चढ़ावा in this build. Non-subscribers are
     * routed to the subscription screen with the blocking feature attached so it can lead
     * with what they were trying to reach.
     */
    val openWallpapersOrGate: () -> Unit = {
        if (isPro) {
            navController.navigate(NavDestinations.WALLPAPERS)
        } else {
            navController.navigate(NavDestinations.chadhaavaRoute(BLOCKED_WALLPAPERS))
        }
    }
    val streak by appContainer.streakStore.currentStreak.collectAsStateWithLifecycle()
    val longestStreak by appContainer.streakStore.longestStreak.collectAsStateWithLifecycle()
    var showStreakDetails by rememberSaveable { mutableStateOf(false) }
    // Membership promo interstitial: shown once per launch to non-subscribers, a few seconds
    // after they've settled in. Dismissable (X or tap-outside); the CTA opens चढ़ावा.
    var membershipPromoShown by rememberSaveable { mutableStateOf(false) }
    var showMembershipPromo by rememberSaveable { mutableStateOf(false) }
    var requestedReelId by rememberSaveable { mutableStateOf<String?>(null) }
    val shouldShowReviewPrompt by appContainer.reviewPromptStore.shouldShowPrompt.collectAsStateWithLifecycle()
    val appScope = rememberCoroutineScope()
    val aartiPlayerState by appContainer.aartiPlayerController.state.collectAsStateWithLifecycle()

    // Record the daily-darshan streak on open. (Intro upsell removed — ad-based model.)
    LaunchedEffect(Unit) {
        context.findActivity()?.let { activity ->
            AdsConsentManager.gather(activity) { }
        }
        appContainer.streakStore.recordVisit()
        appContainer.aartiPlayerController.initialize()
        // BhaktiChat 2.0: one conversation per guide. Collapses any pre-2.0 duplicate
        // threads down to one visible row per guide (archived, not deleted). Idempotent —
        // safe to run on every launch.
        appContainer.threadsRepository.collapseDuplicateThreadsIfNeeded()
    }

    // Analytics: one screen view per navigation route change (single-Activity app, so
    // the PostHog SDK's Activity-level capture can't see Compose routes).
    LaunchedEffect(route) {
        if (route.isNotBlank()) Analytics.screen(route)
    }

    // Fire the membership promo once per launch, for non-subscribers only, after a short
    // settle-in delay and once the language picker is out of the way.
    LaunchedEffect(isPro, languageChosen) {
        if (isPro || membershipPromoShown || !languageChosen) return@LaunchedEffect
        delay(5000)
        if (!isPro && !membershipPromoShown) {
            showMembershipPromo = true
            membershipPromoShown = true
            Analytics.screen("membership_promo")
        }
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
        // Second send path: the Home/BhaktiChat composer and the reel/situation shortcuts
        // create a thread here and generate a reply directly, without going through
        // ChatThreadViewModel.sendMessage(). It therefore needs its own gate — checking only
        // the ViewModel let the quota be bypassed entirely from the tab composer.
        //
        // Only gated when a message is actually being sent. Opening a guide with no prompt
        // is just navigation, and blocking that would strand the user on a paywall for
        // having tapped an avatar.
        if (initialPrompt != null && !entitlementStore.canUseChat) {
            entitlementStore.reportQuotaReached("chat")
            navController.navigate(NavDestinations.chadhaavaRoute(BLOCKED_CHAT_QUOTA))
            return
        }
        appScope.launch {
            val guide = appContainer.guidesRepository.getGuide(guideId) ?: return@launch
            Analytics.guideSelected(guideId = guide.id)
            // One conversation per guide (BhaktiChat 2.0) — reuse the existing thread rather
            // than creating a new one every time this is called.
            val thread = appContainer.threadsRepository.getOrCreateThread(guide.id)
            val isNewThread = appContainer.messagesRepository.listMessages(thread.id).isEmpty()
            val now = System.currentTimeMillis()
            var typingMessageId: String? = null

            // Only seed the opener into a genuinely empty thread — reusing an existing
            // conversation should resume it, not re-greet the user from scratch.
            if (includeOpener && isNewThread) {
                appContainer.messagesRepository.addMessage(
                    MessageEntity(
                        id = UUID.randomUUID().toString(),
                        threadId = thread.id,
                        guideId = guide.id,
                        role = ChatRole.ASSISTANT.wire,
                        content = guide.openingScene(language),
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
                    currentState = ChatConversationState(),
                    remoteConversationId = null,
                    chatApiClient = appContainer.chatApiClient,
                        userFirstName = currentUser.name.orEmpty(),
                    appLanguage = appContainer.languageStore.language.value,
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
                    ?: thinkingFallback
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

    // The "start a new chat" affordance (floating guide heads in the BhaktiChat tab) —
    // always a clean, fresh conversation, not a resume of whatever was said before. Per the
    // one-thread-per-guide rule this clears that guide's existing thread rather than
    // creating a second one.
    fun startFreshThread(guideId: String) {
        appScope.launch {
            val guide = appContainer.guidesRepository.getGuide(guideId) ?: return@launch
            Analytics.guideSelected(guideId = guide.id)
            val thread = appContainer.threadsRepository.getOrCreateThread(guide.id)
            val now = System.currentTimeMillis()
            appContainer.messagesRepository.deleteThreadMessages(thread.id)
            appContainer.threadsRepository.resetThreadState(thread.id, now)
            appContainer.messagesRepository.addMessage(
                MessageEntity(
                    id = UUID.randomUUID().toString(),
                    threadId = thread.id,
                    guideId = guide.id,
                    role = ChatRole.ASSISTANT.wire,
                    content = guide.openingScene(language),
                    createdAt = now,
                    status = MessageStatus.SENT.name
                )
            )
            appContainer.threadsRepository.touchThread(thread.id, now)
            navController.navigate(NavDestinations.threadRoute(thread.id))
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

    if (showStreakDetails) {
        StreakDetailDialog(
            currentStreak = streak,
            longestStreak = longestStreak,
            onDismiss = { showStreakDetails = false }
        )
    }

    androidx.compose.foundation.layout.Box(modifier = Modifier.fillMaxSize()) {
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
                    onOpenReels = { reelId ->
                        requestedReelId = reelId
                        Analytics.reelOpened()
                        navController.navigate(NavDestinations.REELS)
                    },
                    onOpenWallpapers = openWallpapersOrGate,
                    onPlayAartiFromFeed = { aartiId, startPositionMillis ->
                        appScope.launch {
                            val all = appContainer.aartiRepository.loadAartis()
                            val playable = all.filter { it.hasAudio }
                            if (playable.any { it.id == aartiId }) {
                                appContainer.aartiPlayerController.playQueue(
                                    aartis = playable,
                                    startId = aartiId,
                                    startPositionMillis = startPositionMillis
                                )
                                // Straight to the now-playing screen for this aarti, not the
                                // list it lives in — the list is one more tap the user already
                                // told us which track they want.
                                appContainer.aartiPlayerController.expandFullScreen()
                            }
                        }
                    },
                    onToggleAartiSpotlight = {
                        if (aartiPlayerState.currentAartiId != null) {
                            appContainer.aartiPlayerController.togglePlayPause()
                        } else {
                            appScope.launch {
                                val all = appContainer.aartiRepository.loadAartis()
                                val start = all.firstOrNull { it.isTop } ?: all.firstOrNull()
                                if (start != null) {
                                    appContainer.aartiPlayerController.playQueue(
                                        all.filter { it.hasAudio },
                                        start.id
                                    )
                                }
                            }
                        }
                    },
                    reelsRepository = appContainer.reelsRepository,
                    aartiRepository = appContainer.aartiRepository,
                    choghadiyaRepository = appContainer.choghadiyaRepository,
                    aartiPlayerState = aartiPlayerState,
                    userName = currentUser.name.orEmpty(),
                    streak = streak,
                    onOpenStreak = { showStreakDetails = true },
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
            ) {
                // BhaktiChat 2.0: the old guide-picker hub is retired — "start a new chat"
                // (guide heads + composer) is merged directly into the conversation list below
                // (see HistoryRoute's StartNewChatRow/ChatComposer), same as iOS's
                // BhaktiChatScreen. The `guide` query arg is unused: nothing in the app actually
                // navigates here with one set (confirmed via grep) — it only ever existed for
                // the retired hub's own initial-guide preselection.
                HistoryRoute(
                    factory = HistoryViewModelFactory(
                        threadsRepository = appContainer.threadsRepository,
                        messagesRepository = appContainer.messagesRepository,
                        guidesRepository = appContainer.guidesRepository,
                        creationRepository = appContainer.divineCreationRepository,
                        bookmarkStore = appContainer.bookmarkStore,
                        aartiRepository = appContainer.aartiRepository,
                        languageStore = appContainer.languageStore
                    ),
                    bookmarkStore = appContainer.bookmarkStore,
                    onOpenProfile = { navController.navigate(NavDestinations.PROFILE) },
                    onOpenThread = { threadId ->
                        navController.navigate(NavDestinations.threadRoute(threadId))
                    },
                    onOpenCreation = { creationId ->
                        navController.navigate(NavDestinations.divineImageResultRoute(creationId))
                    },
                    onStartFreshChat = { guideId -> startFreshThread(guideId) },
                    onSendPrompt = { guideId, prompt ->
                        launchThread(guideId = guideId, initialPrompt = prompt, includeOpener = false)
                    }
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
                        entitlementStore = entitlementStore,
                        reviewPromptStore = appContainer.reviewPromptStore,
                        userFirstName = currentUser.name.orEmpty(),
                        languageStore = appContainer.languageStore
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                LaunchedEffect(vm) {
                    vm.paywallEvents.collect {
                        navController.navigate(NavDestinations.chadhaavaRoute(BLOCKED_CHAT_QUOTA))
                    }
                }
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
                            audioFocusManager = VoiceAudioFocusManager(LocalContext.current),
                            // The chosen language, not a hard-coded Hindi. This literal is why
                            // voice mode was always Devanagari no matter what the user picked:
                            // the guide's name and the opening scene both read from it, so the
                            // call opened in Hindi while the rest of the screen was English.
                            language = language
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
                    onOpenHistory = { navController.navigate(NavDestinations.bhaktiChatRoute()) },
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

            composable(NavDestinations.REELS) {
                ReelsScreen(
                    factory = ReelsViewModelFactory(
                        reelsRepository = appContainer.reelsRepository,
                        initialReelId = requestedReelId
                    ),
                    onAskAbout = { reel ->
                        // displayTitle/displayCaption, not the raw fields: static reels
                        // carry no literals any more and resolve from their slug.
                        val prompt = reelAskPrefix +
                            "\"${reel.displayTitle(language)}\". ${reel.displayCaption(language)}\n\n" +
                            reelAskMeaning
                        launchThread(guideId = reel.deityId, initialPrompt = prompt, includeOpener = false)
                    }
                )
                LaunchedEffect(Unit) { requestedReelId = null }
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
                    onOpenWallpapers = openWallpapersOrGate
                )
            }

            composable(NavDestinations.FESTIVALS) {
                FestivalsScreen(onBack = { navController.popBackStack() })
            }

            composable(NavDestinations.PANCHANG) {
                PanchangScreen(onBack = { navController.popBackStack() })
            }

            composable(NavDestinations.WALLPAPERS) {
                // Backstop for any path that reaches this destination directly (deep link,
                // restored back stack, or entitlement lapsing while the screen is open).
                if (!isPro) {
                    LaunchedEffect(Unit) {
                        navController.navigate(NavDestinations.chadhaavaRoute(BLOCKED_WALLPAPERS)) {
                            popUpTo(NavDestinations.WALLPAPERS) { inclusive = true }
                        }
                    }
                } else {
                    WallpapersScreen(
                        onBack = { navController.popBackStack() },
                        onOpenWallpaper = { wallpaperId ->
                            navController.navigate(NavDestinations.wallpaperDetailRoute(wallpaperId))
                        }
                    )
                }
            }

            composable(
                route = NavDestinations.CHADHAAVA,
                arguments = listOf(
                    navArgument(NavDestinations.CHADHAAVA_BLOCKED_ARG) {
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { backStackEntry ->
                val blocked = backStackEntry.arguments
                    ?.getString(NavDestinations.CHADHAAVA_BLOCKED_ARG)
                    ?.let { raw ->
                        when (raw) {
                            BLOCKED_WALLPAPERS -> BlockedFeature.WALLPAPERS
                            BLOCKED_CHAT_QUOTA -> BlockedFeature.CHAT_QUOTA
                            BLOCKED_IMAGE_QUOTA -> BlockedFeature.IMAGE_QUOTA
                            else -> null
                        }
                    }

                val vm: ChadhaavaViewModel = viewModel(
                    factory = ChadhaavaViewModelFactory(
                        repository = appContainer.subscriptionRepository,
                        blockedBy = blocked
                    )
                )
                val chadhaavaContext = LocalContext.current
                ChadhaavaScreen(
                    viewModel = vm,
                    userEmail = currentUser.email,
                    onBack = if (blocked != null) {
                        { navController.popBackStack() }
                    } else {
                        null
                    },
                    onOpenUrl = { url ->
                        runCatching {
                            chadhaavaContext.startActivity(
                                android.content.Intent(
                                    android.content.Intent.ACTION_VIEW,
                                    android.net.Uri.parse(url)
                                )
                            )
                        }
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
                        entitlementStore = entitlementStore,
                        languageStore = appContainer.languageStore
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                LaunchedEffect(vm) {
                    vm.paywallEvents.collect {
                        navController.navigate(NavDestinations.chadhaavaRoute(BLOCKED_IMAGE_QUOTA))
                    }
                }
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
                        anonUserKey = AnonUserKey.get(context),
                        languageStore = appContainer.languageStore,
                        entitlementStore = entitlementStore
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                LaunchedEffect(vm) {
                    vm.paywallEvents.collect {
                        navController.navigate(NavDestinations.chadhaavaRoute(BLOCKED_IMAGE_QUOTA))
                    }
                }
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
                    playerController = appContainer.aartiPlayerController,
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
                    factory = ChoghadiyaViewModelFactory(
                        appContainer.choghadiyaRepository,
                        appContainer.languageStore
                    )
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
                    currentUser = currentUser,
                    onBack = { navController.popBackStack() },
                    onSignOut = onSignOut,
                    onDeleteAccount = onDeleteAccount
                )
            }
        }
    }

    // Rendered here (app root, same window as the Scaffold) rather than as a Dialog from inside
    // the Aartis screen — see the doc comment on AartiNowPlayingScreen for why.
    if (aartiPlayerState.isFullScreen) {
        AartiNowPlayingScreen(
            state = aartiPlayerState,
            playerController = appContainer.aartiPlayerController,
            onDismiss = { appContainer.aartiPlayerController.collapseFullScreen() }
        )
    }

    // Topmost child of the root Box, so it floats over the whole app.
    if (showMembershipPromo && !isPro) {
        MembershipInterstitial(
            onClose = { showMembershipPromo = false },
            onGetMembership = {
                showMembershipPromo = false
                Analytics.screen("membership_promo_cta")
                navigateToTopLevel(NavDestinations.CHADHAAVA_BASE)
            }
        )
    }
    }
    }
}

/**
 * A dismissable ("crossable") full-screen promo for BhaktiChat Pro. The X or a tap outside the
 * card closes it; the CTA routes to the चढ़ावा subscription screen. Deliberately soft-sell —
 * one appearance per launch, non-subscribers only (gated at the call site).
 */
@Composable
private fun MembershipInterstitial(
    onClose: () -> Unit,
    onGetMembership: () -> Unit
) {
    val scrimInteraction = remember { MutableInteractionSource() }
    val cardInteraction = remember { MutableInteractionSource() }
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xCC120A06))
            .clickable(interactionSource = scrimInteraction, indication = null) { onClose() },
        contentAlignment = Alignment.Center
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 28.dp)
                .clip(RoundedCornerShape(26.dp))
                .background(Color(0xFFFFFDFB))
                // Consume taps on the card so they don't fall through to the dismiss scrim.
                .clickable(interactionSource = cardInteraction, indication = null) { }
        ) {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(190.dp)
            ) {
                Image(
                    painter = painterResource(R.drawable.chadhaava_hero),
                    contentDescription = null,
                    contentScale = ContentScale.Crop,
                    modifier = Modifier.fillMaxSize()
                )
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .background(
                            Brush.verticalGradient(
                                listOf(Color(0x40000000), Color.Transparent, Color(0x40EA580C))
                            )
                        )
                )
                Box(
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(12.dp)
                        .size(30.dp)
                        .clip(RoundedCornerShape(15.dp))
                        .background(Color(0x99000000))
                        .clickable { onClose() },
                    contentAlignment = Alignment.Center
                ) {
                    Text("✕", color = Color.White, fontSize = 15.sp, fontWeight = FontWeight.Bold)
                }
            }

            Column(
                modifier = Modifier.padding(20.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                Text(
                    text = t("promo_title"),
                    fontSize = 22.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = Color(0xFF2A1C15)
                )
                Text(
                    text = t("promo_subtitle"),
                    fontSize = 14.sp,
                    color = Color(0xFF8A6F5C)
                )
                Spacer(Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(52.dp)
                        .clip(RoundedCornerShape(14.dp))
                        .background(
                            Brush.horizontalGradient(listOf(Color(0xFFFB923C), Color(0xFFEA580C)))
                        )
                        .clickable { onGetMembership() },
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = t("promo_cta"),
                        fontSize = 16.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                }
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
        title = { androidx.compose.material3.Text(t("review_title")) },
        text = {
            androidx.compose.material3.Text(
                t("review_body")
            )
        },
        confirmButton = {
            androidx.compose.material3.TextButton(onClick = onEnjoying) {
                androidx.compose.material3.Text(t("review_yes"))
            }
        },
        dismissButton = {
            androidx.compose.material3.TextButton(onClick = onNotNow) {
                androidx.compose.material3.Text(t("common_not_now"))
            }
        }
    )
}

@Composable
private fun StreakDetailDialog(
    currentStreak: Int,
    longestStreak: Int,
    onDismiss: () -> Unit
) {
    androidx.compose.material3.AlertDialog(
        onDismissRequest = onDismiss,
        icon = {
            androidx.compose.material3.Text(
                text = "🔥",
                style = androidx.compose.material3.MaterialTheme.typography.displaySmall
            )
        },
        title = {
            androidx.compose.material3.Text(
                text = t("streak_title"),
                style = androidx.compose.material3.MaterialTheme.typography.headlineSmall
            )
        },
        text = {
            androidx.compose.foundation.layout.Column(
                verticalArrangement = androidx.compose.foundation.layout.Arrangement.spacedBy(
                    12.dp
                )
            ) {
                androidx.compose.material3.Text(
                    text = t("streak_body").format(currentStreak),
                    style = androidx.compose.material3.MaterialTheme.typography.bodyLarge
                )
                androidx.compose.material3.Surface(
                    shape = androidx.compose.foundation.shape.RoundedCornerShape(
                        16.dp
                    ),
                    color = androidx.compose.material3.MaterialTheme.colorScheme.primaryContainer
                ) {
                    androidx.compose.foundation.layout.Row(
                        modifier = androidx.compose.ui.Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = androidx.compose.foundation.layout.Arrangement.SpaceAround
                    ) {
                        StreakMetric(value = currentStreak, label = t("streak_now"))
                        StreakMetric(value = longestStreak, label = t("streak_best"))
                    }
                }
                androidx.compose.material3.Text(
                    text = t("streak_sub"),
                    style = androidx.compose.material3.MaterialTheme.typography.bodyMedium,
                    color = androidx.compose.material3.MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        },
        confirmButton = {
            androidx.compose.material3.TextButton(onClick = onDismiss) {
                androidx.compose.material3.Text(t("common_ok"))
            }
        }
    )
}

@Composable
private fun StreakMetric(value: Int, label: String) {
    androidx.compose.foundation.layout.Column(
        horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally
    ) {
        androidx.compose.material3.Text(
            text = value.toString(),
            style = androidx.compose.material3.MaterialTheme.typography.headlineMedium,
            color = androidx.compose.material3.MaterialTheme.colorScheme.primary
        )
        androidx.compose.material3.Text(
            text = t("streak_days_suffix").format(label),
            style = androidx.compose.material3.MaterialTheme.typography.labelMedium
        )
    }
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
        route == NavDestinations.REELS ||
        // चढ़ावा is a tab, so the bar stays visible on it.
        route.startsWith(NavDestinations.CHADHAAVA_BASE)
}

/** Route argument value marking wallpapers as the feature that gated the user. */
internal const val BLOCKED_WALLPAPERS = "wallpapers"
internal const val BLOCKED_CHAT_QUOTA = "chat_quota"
internal const val BLOCKED_IMAGE_QUOTA = "image_quota"
