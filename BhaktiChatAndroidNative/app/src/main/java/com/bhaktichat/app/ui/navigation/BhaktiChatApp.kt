package com.bhaktichat.app.ui.navigation

import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.ime
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Icon
import androidx.compose.material3.NavigationBar
import androidx.compose.material3.NavigationBarItem
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.bhaktichat.app.BhaktiChatApplication
import com.bhaktichat.app.ui.screens.aartis.AartiDetailScreen
import com.bhaktichat.app.ui.screens.aartis.AartisScreen
import com.bhaktichat.app.ui.screens.chat.ChatScreen
import com.bhaktichat.app.ui.screens.chat.ChatViewModel
import com.bhaktichat.app.ui.screens.chat.ChatViewModelFactory
import com.bhaktichat.app.ui.screens.choghadiya.ChoghadiyaRoute
import com.bhaktichat.app.ui.screens.choghadiya.ChoghadiyaViewModel
import com.bhaktichat.app.ui.screens.choghadiya.ChoghadiyaViewModelFactory
import com.bhaktichat.app.ui.screens.guidepicker.ChatEntryScreen
import com.bhaktichat.app.ui.screens.guidepicker.GuidePickerScreen
import com.bhaktichat.app.ui.screens.guideprofile.GuideProfileScreen
import com.bhaktichat.app.ui.screens.home.HomeScreen
import com.bhaktichat.app.ui.screens.profile.ProfileScreen

@Composable
fun BhaktiChatApp() {
    val context = LocalContext.current
    val appContainer = (context.applicationContext as BhaktiChatApplication).container
    val navController = rememberNavController()
    val backStack by navController.currentBackStackEntryAsState()
    val route = backStack?.destination?.route.orEmpty()
    val density = LocalDensity.current
    val imeVisible = WindowInsets.ime.getBottom(density) > 0
    val isChatRoute = route.startsWith("chat")
    val showBottomBar = route != NavDestinations.GUIDE_PROFILE && !(isChatRoute && imeVisible)
    val authState by appContainer.authPreferences.state.collectAsStateWithLifecycle()

    fun navigateToTopLevel(destination: String) {
        val targetRoute = if (destination == NavDestinations.CHAT_ENTRY) {
            NavDestinations.GUIDE_PICKER
        } else {
            destination
        }

        val poppedToExistingRoute = navController.popBackStack(targetRoute, inclusive = false)
        if (!poppedToExistingRoute) {
            navController.navigate(targetRoute) {
                popUpTo(navController.graph.findStartDestination().id) {
                    saveState = targetRoute != NavDestinations.HOME
                }
                launchSingleTop = true
                restoreState = targetRoute != NavDestinations.HOME
            }
        }
    }

    Scaffold(
        bottomBar = {
            if (showBottomBar) {
                NavigationBar {
                    bottomNavItems.forEach { item ->
                        val selected = when (item.route) {
                            NavDestinations.CHAT_ENTRY -> {
                                route.startsWith("chat") ||
                                    route == NavDestinations.GUIDE_PICKER ||
                                    route == NavDestinations.CHAT_ENTRY
                            }
                            NavDestinations.HOME -> route == NavDestinations.HOME
                            NavDestinations.AARTIS -> route == NavDestinations.AARTIS || route.startsWith("aarti/")
                            NavDestinations.CHOGHADIYA -> route == NavDestinations.CHOGHADIYA
                            NavDestinations.PROFILE -> route == NavDestinations.PROFILE
                            else -> false
                        }

                        NavigationBarItem(
                            selected = selected,
                            onClick = { navigateToTopLevel(item.route) },
                            icon = {
                                Icon(
                                    imageVector = if (selected) item.selectedIcon else item.icon,
                                    contentDescription = item.label,
                                    modifier = if (item.emphasize) Modifier.padding(bottom = 2.dp) else Modifier
                                )
                            },
                            label = { Text(item.label) }
                        )
                    }
                }
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
                val lastSelectedGuideId = appContainer.guidePreferences.lastGuideId() ?: "krishna"
                val hasRecentConversation = appContainer.guidePreferences
                    .conversationId(lastSelectedGuideId)
                    ?.isNotBlank() == true

                HomeScreen(
                    aartiRepository = appContainer.aartiRepository,
                    lastSelectedGuideId = lastSelectedGuideId,
                    hasRecentConversation = hasRecentConversation,
                    onOpenHeroChat = { guideId ->
                        appContainer.guidePreferences.setLastGuideId(guideId)
                        navController.navigate(NavDestinations.chatRoute(guideId))
                    },
                    onGuideSelected = { guideId ->
                        appContainer.guidePreferences.setLastGuideId(guideId)
                        navController.navigate(NavDestinations.chatRoute(guideId))
                    },
                    onSeeAllGuides = {
                        navController.navigate(NavDestinations.GUIDE_PICKER)
                    },
                    onOpenAartis = {
                        navController.navigate(NavDestinations.AARTIS)
                    },
                    onOpenAarti = { aartiId ->
                        navController.navigate(NavDestinations.aartiDetailRoute(aartiId))
                    },
                    onOpenChoghadiya = {
                        navController.navigate(NavDestinations.CHOGHADIYA)
                    },
                    onOpenChatQuickAction = { prefill ->
                        appContainer.guidePreferences.setLastGuideId("krishna")
                        navController.navigate(NavDestinations.chatRoute("krishna", prefill))
                    },
                    onOpenProfile = {
                        navController.navigate(NavDestinations.PROFILE)
                    }
                )
            }

            composable(NavDestinations.CHAT_ENTRY) {
                ChatEntryScreen(
                    repository = appContainer.chatRepository,
                    authState = authState,
                    onNavigateToGuide = { guideId ->
                        navController.navigate(NavDestinations.chatRoute(guideId))
                    },
                    onNavigateToPicker = {
                        navController.navigate(NavDestinations.GUIDE_PICKER)
                    },
                    onAccountClick = {
                        navController.navigate(NavDestinations.PROFILE)
                    }
                )
            }

            composable(NavDestinations.GUIDE_PICKER) {
                GuidePickerScreen(onGuideClick = { guideId ->
                    appContainer.guidePreferences.setLastGuideId(guideId)
                    navController.navigate(NavDestinations.chatRoute(guideId)) {
                        popUpTo(NavDestinations.GUIDE_PICKER) { inclusive = true }
                    }
                })
            }

            composable(
                route = NavDestinations.CHAT,
                arguments = listOf(
                    navArgument("guideId") { type = NavType.StringType },
                    navArgument(NavDestinations.CHAT_PREFILL_ARG) {
                        type = NavType.StringType
                        nullable = true
                        defaultValue = null
                    }
                )
            ) { entry ->
                val guideId = entry.arguments?.getString("guideId").orEmpty()
                val routePrefill = entry.arguments?.getString(NavDestinations.CHAT_PREFILL_ARG)
                val vm: ChatViewModel = viewModel(
                    key = "chat_$guideId",
                    factory = ChatViewModelFactory(
                        guideId = guideId,
                        repository = appContainer.chatRepository,
                        guidePreferences = appContainer.guidePreferences,
                        authPreferences = appContainer.authPreferences
                    )
                )
                val uiState by vm.uiState.collectAsStateWithLifecycle()
                val prefillTopic = entry.savedStateHandle.get<String>(NavDestinations.PREFILL_TOPIC_KEY)
                    ?: navController.previousBackStackEntry
                        ?.savedStateHandle
                        ?.get<String>(NavDestinations.PREFILL_TOPIC_KEY)
                val routePrefillApplied =
                    entry.savedStateHandle.get<Boolean>(NavDestinations.CHAT_ROUTE_PREFILL_APPLIED_KEY) == true
                val startNewChat = entry.savedStateHandle.get<Boolean>(NavDestinations.START_NEW_CHAT_KEY) == true

                LaunchedEffect(routePrefill, routePrefillApplied) {
                    if (!routePrefill.isNullOrBlank() && !routePrefillApplied) {
                        vm.applyPrefillIfNeeded(routePrefill)
                        entry.savedStateHandle[NavDestinations.CHAT_ROUTE_PREFILL_APPLIED_KEY] = true
                    }
                }

                LaunchedEffect(prefillTopic) {
                    if (!prefillTopic.isNullOrBlank()) {
                        vm.applyPrefillIfNeeded(prefillTopic)
                        entry.savedStateHandle.remove<String>(NavDestinations.PREFILL_TOPIC_KEY)
                        navController.previousBackStackEntry
                            ?.savedStateHandle
                            ?.remove<String>(NavDestinations.PREFILL_TOPIC_KEY)
                    }
                }

                LaunchedEffect(startNewChat) {
                    if (startNewChat) {
                        vm.onNewChat()
                        entry.savedStateHandle.remove<Boolean>(NavDestinations.START_NEW_CHAT_KEY)
                    }
                }

                ChatScreen(
                    uiState = uiState,
                    focusEvents = vm.refocusEvents,
                    onInputChange = vm::onInputChanged,
                    onSend = vm::onSend,
                    onNewChat = vm::onNewChat,
                    onSelectPrompt = vm::onSelectSuggestedPrompt,
                    onSwitchGuide = {
                        navController.navigate(NavDestinations.GUIDE_PICKER)
                    },
                    onOpenGuideProfile = {
                        navController.navigate(NavDestinations.guideProfileRoute(guideId))
                    }
                )
            }

            composable(
                route = NavDestinations.GUIDE_PROFILE,
                arguments = listOf(navArgument("guideId") { type = NavType.StringType })
            ) { entry ->
                val guideId = entry.arguments?.getString("guideId").orEmpty()
                GuideProfileScreen(
                    guideId = guideId,
                    onBack = { navController.popBackStack() },
                    onStartNewChat = {
                        navController.previousBackStackEntry
                            ?.savedStateHandle
                            ?.set(NavDestinations.START_NEW_CHAT_KEY, true)
                        navController.popBackStack()
                    },
                    onSuggestedTopic = { topic ->
                        navController.previousBackStackEntry
                            ?.savedStateHandle
                            ?.set(NavDestinations.PREFILL_TOPIC_KEY, topic)
                        navController.popBackStack()
                    }
                )
            }

            composable(NavDestinations.AARTIS) {
                AartisScreen(
                    repository = appContainer.aartiRepository,
                    savedAartisStore = appContainer.savedAartisStore,
                    onOpenDetail = { aartiId ->
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
                        appContainer.guidePreferences.setLastGuideId("krishna")
                        navController.navigate(NavDestinations.chatRoute("krishna", prefill))
                    }
                )
            }

            composable(NavDestinations.CHOGHADIYA) {
                val vm: ChoghadiyaViewModel = viewModel(
                    factory = ChoghadiyaViewModelFactory(appContainer.choghadiyaRepository)
                )
                ChoghadiyaRoute(
                    viewModel = vm,
                    onAskShani = { prompt ->
                        appContainer.guidePreferences.setLastGuideId("shani")
                        navController.navigate(NavDestinations.chatRoute("shani", prompt))
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
