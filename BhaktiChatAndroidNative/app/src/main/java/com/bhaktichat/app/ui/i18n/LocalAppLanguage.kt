package com.bhaktichat.app.ui.i18n

import androidx.compose.runtime.compositionLocalOf
import com.bhaktichat.app.domain.AppLanguage

/**
 * The user's chosen [AppLanguage], available to any composable without prop-drilling it
 * through every screen's function signature. Provided once at the app root
 * (`BhaktiChatApp`), backed by `appContainer.languageStore.language`.
 *
 * There's no sensible default to fall back to silently — every read site should exist
 * underneath the root's `CompositionLocalProvider`, which only mounts once a language is
 * actually selected (see `BhaktiChatApp`'s gate). If this ever throws, a composable is
 * reading it from outside that tree.
 */
val LocalAppLanguage = compositionLocalOf<AppLanguage> {
    error("LocalAppLanguage read before BhaktiChatApp provided it — check the composition root.")
}
