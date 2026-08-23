package com.bhaktichat.app.ui.components.ads

/**
 * Master switch for AdMob.
 *
 * Turned off with the move to a subscription-only model: ad revenue was not material, and
 * every surface that carried an ad now sits behind चढ़ावा instead. Showing ads to the
 * remaining free surfaces (chat, choghadiya, panchang) would tax exactly the habit loop
 * that brings people back to be converted.
 *
 * The SDK, ad units and placement call sites are deliberately left in place so this is a
 * one-line rollback if the subscription numbers do not hold up. Strip them out once they do.
 */
internal const val ADS_ENABLED = false
