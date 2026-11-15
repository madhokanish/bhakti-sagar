package com.bhaktichat.app.data.remote

/**
 * The server answered HTTP 402: the feature (divine images, voice) is for चढ़ावा members only.
 * Thrown inside the remote clients' `runCatching` so callers can tell it apart from a generic
 * failure and send the user to membership instead of showing "try again".
 */
class SubscriptionRequiredException : Exception("Subscription required")
