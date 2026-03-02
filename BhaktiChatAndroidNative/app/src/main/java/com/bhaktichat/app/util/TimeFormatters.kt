package com.bhaktichat.app.util

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val timeFormat = SimpleDateFormat("HH:mm", Locale.getDefault())

fun formatTime(epochMillis: Long): String = timeFormat.format(Date(epochMillis))
