package com.bhaktichat.app.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Text
import androidx.compose.material3.TextField
import androidx.compose.material3.TextFieldDefaults
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.bhaktichat.app.R
import kotlinx.coroutines.delay

/**
 * Phone sign-in, in two screens.
 *
 * Pure UI: every side effect is a callback, so this file can be dropped in and previewed
 * before the Firebase plumbing behind it exists. The host owns FirebaseAuth entirely.
 *
 * Shaped after what this audience already uses every day (PhonePe, WhatsApp, Truecaller):
 * a fixed +91, a bare 10-digit field, and a 6-box code that fills itself in. Nothing here
 * asks for a name or an email, because a phone number is the whole account.
 */

private object PhoneAuthPalette {
    val Accent = Color(0xFFEA580C)
    val TextPrimary = Color(0xFF2A1C15)
    val TextSecondary = Color(0xFF8A6F5C)
    val TextMuted = Color(0xFFBDA491)
    val Field = Color(0xFFFFFFFF)
    val FieldBorder = Color(0x1A784028)
    val Page = Color(0xFFFDF8F3)
    val Error = Color(0xFFC2410C)
    val Disabled = Color(0xFFE7DACD)
}

// --- 1. Number entry -----------------------------------------------------------------

/**
 * @param phone digits only, no country code. The caller keeps it so a rotation does not
 *   wipe a half-typed number.
 * @param error already localised; shown inline under the field rather than as a toast,
 *   which is easy to miss and impossible to re-read.
 */
@Composable
fun PhoneNumberScreen(
    phone: String,
    onPhoneChange: (String) -> Unit,
    onContinue: () -> Unit,
    onUseGoogle: () -> Unit,
    isSending: Boolean,
    error: String?,
    title: String,
    subtitle: String,
    continueLabel: String,
    googleLabel: String,
    // Optional, discreet reviewer/testing path (email or username). Kept off by default so
    // real users only see phone + Google; the host supplies it to preserve the access flow.
    accessLabel: String = "",
    onUseAccess: (() -> Unit)? = null
) {
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() }

    // 10 digits is the whole of India's mobile numbering plan, so the button can enable
    // itself the moment the number is complete instead of waiting for a submit to fail.
    val isComplete = phone.length == 10

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PhoneAuthPalette.Page)
            .padding(horizontal = 24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Image(
            painter = painterResource(R.drawable.bhaktichat_logo),
            contentDescription = "BhaktiChat",
            modifier = Modifier.size(96.dp)
        )
        Spacer(Modifier.height(12.dp))
        Text("BhaktiChat", fontSize = 22.sp, fontWeight = FontWeight.ExtraBold, color = PhoneAuthPalette.TextPrimary)
        Spacer(Modifier.height(40.dp))

        // English leads because we have not asked for a language yet; the Hindi line under it
        // is a hint, not a translation. Both stay fixed regardless of the stored language.
        Text(
            title,
            fontSize = 24.sp,
            fontWeight = FontWeight.ExtraBold,
            color = PhoneAuthPalette.TextPrimary,
            textAlign = TextAlign.Center
        )
        Spacer(Modifier.height(6.dp))
        Text(subtitle, fontSize = 15.sp, color = PhoneAuthPalette.TextSecondary, textAlign = TextAlign.Center)
        Spacer(Modifier.height(24.dp))

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .height(58.dp)
                .background(PhoneAuthPalette.Field, RoundedCornerShape(14.dp))
                .border(1.dp, PhoneAuthPalette.FieldBorder, RoundedCornerShape(14.dp)),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Fixed, not a picker. Every user of this app is dialling +91, and a country
            // list is a decision they do not need to make.
            Text(
                "+91",
                modifier = Modifier.padding(start = 18.dp),
                fontSize = 17.sp,
                fontWeight = FontWeight.Bold,
                color = PhoneAuthPalette.TextPrimary
            )
            Box(
                Modifier
                    .padding(horizontal = 12.dp)
                    .width(1.dp)
                    .height(24.dp)
                    .background(PhoneAuthPalette.FieldBorder)
            )
            TextField(
                value = phone,
                // Filtered here rather than validated on submit: pasting a number with
                // spaces, +91 or dashes is common and should just work.
                onValueChange = { raw -> onPhoneChange(raw.filter { it.isDigit() }.takeLast(10)) },
                singleLine = true,
                textStyle = TextStyle(
                    fontSize = 17.sp,
                    fontWeight = FontWeight.SemiBold,
                    color = PhoneAuthPalette.TextPrimary,
                    letterSpacing = 1.sp
                ),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .focusRequester(focus)
            )
        }

        if (error != null) {
            Spacer(Modifier.height(10.dp))
            Text(error, fontSize = 13.sp, color = PhoneAuthPalette.Error)
        }

        Spacer(Modifier.height(20.dp))
        PrimaryButton(
            label = continueLabel,
            enabled = isComplete && !isSending,
            loading = isSending,
            onClick = onContinue
        )

        // Google sits right here on the main screen, not behind another tap. The logo carries
        // the meaning, so the label stays short.
        Spacer(Modifier.height(14.dp))
        GoogleButton(
            label = googleLabel,
            enabled = !isSending,
            onClick = onUseGoogle
        )

        if (onUseAccess != null) {
            Spacer(Modifier.height(18.dp))
            Text(
                accessLabel,
                modifier = Modifier
                    .clickable(enabled = !isSending) { onUseAccess() }
                    .padding(vertical = 6.dp),
                fontSize = 12.sp,
                color = PhoneAuthPalette.TextMuted,
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
private fun GoogleButton(
    label: String,
    enabled: Boolean,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .height(52.dp)
            .background(Color.White, RoundedCornerShape(14.dp))
            .border(1.dp, PhoneAuthPalette.FieldBorder, RoundedCornerShape(14.dp))
            .clickable(enabled = enabled) { onClick() },
        horizontalArrangement = Arrangement.Center,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Image(
            painter = painterResource(R.drawable.ic_google_g),
            contentDescription = null,
            modifier = Modifier.size(20.dp)
        )
        Spacer(Modifier.width(10.dp))
        Text(label, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = PhoneAuthPalette.TextPrimary)
    }
}

// --- 2. Code entry -------------------------------------------------------------------

/**
 * @param code up to 6 digits. The host sets this directly when SMS auto-retrieval fires,
 *   which is why the boxes render [code] rather than owning it.
 * @param onCodeComplete called as soon as the sixth digit lands, so nobody has to hunt for
 *   a Verify button they were never going to think about.
 */
@Composable
fun OtpScreen(
    phone: String,
    code: String,
    onCodeChange: (String) -> Unit,
    onCodeComplete: () -> Unit,
    onResend: () -> Unit,
    onChangeNumber: () -> Unit,
    isVerifying: Boolean,
    error: String?,
    title: String,
    sentToLabel: String,
    changeNumberLabel: String,
    resendLabel: String,
    resendInLabel: (Int) -> String
) {
    val focus = remember { FocusRequester() }
    LaunchedEffect(Unit) { focus.requestFocus() }

    // Auto-submit on the last digit. Firing from a LaunchedEffect keyed on the code keeps it
    // to exactly one call even if the field recomposes.
    LaunchedEffect(code) { if (code.length == 6) onCodeComplete() }

    var secondsLeft by remember { mutableIntStateOf(30) }
    LaunchedEffect(Unit) {
        while (secondsLeft > 0) { delay(1000); secondsLeft -= 1 }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(PhoneAuthPalette.Page)
            .padding(horizontal = 24.dp),
        verticalArrangement = Arrangement.Center
    ) {
        Text(title, fontSize = 26.sp, fontWeight = FontWeight.ExtraBold, color = PhoneAuthPalette.TextPrimary)
        Spacer(Modifier.height(8.dp))

        Row(verticalAlignment = Alignment.CenterVertically) {
            Text("$sentToLabel +91 $phone", fontSize = 14.sp, color = PhoneAuthPalette.TextSecondary)
            Spacer(Modifier.width(8.dp))
            Text(
                changeNumberLabel,
                modifier = Modifier.clickable { onChangeNumber() },
                fontSize = 14.sp,
                fontWeight = FontWeight.SemiBold,
                color = PhoneAuthPalette.Accent
            )
        }

        Spacer(Modifier.height(26.dp))

        Box {
            // One real field behind six painted boxes. Six separate fields means six focus
            // states to keep in sync, and paste and autofill both break on them.
            TextField(
                value = code,
                onValueChange = { raw -> onCodeChange(raw.filter { it.isDigit() }.take(6)) },
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.NumberPassword),
                textStyle = TextStyle(color = Color.Transparent, fontSize = 1.sp),
                colors = TextFieldDefaults.colors(
                    focusedContainerColor = Color.Transparent,
                    unfocusedContainerColor = Color.Transparent,
                    focusedIndicatorColor = Color.Transparent,
                    unfocusedIndicatorColor = Color.Transparent,
                    cursorColor = Color.Transparent
                ),
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp)
                    .focusRequester(focus)
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                repeat(6) { index ->
                    val digit = code.getOrNull(index)?.toString().orEmpty()
                    val active = index == code.length
                    Box(
                        modifier = Modifier
                            .weight(1f)
                            .height(56.dp)
                            .background(PhoneAuthPalette.Field, RoundedCornerShape(12.dp))
                            .border(
                                width = if (active) 2.dp else 1.dp,
                                color = when {
                                    error != null -> PhoneAuthPalette.Error
                                    active -> PhoneAuthPalette.Accent
                                    else -> PhoneAuthPalette.FieldBorder
                                },
                                shape = RoundedCornerShape(12.dp)
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            digit,
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = PhoneAuthPalette.TextPrimary
                        )
                    }
                }
            }
        }

        if (error != null) {
            Spacer(Modifier.height(10.dp))
            Text(error, fontSize = 13.sp, color = PhoneAuthPalette.Error)
        }

        Spacer(Modifier.height(22.dp))

        if (isVerifying) {
            Box(Modifier.fillMaxWidth(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(
                    color = PhoneAuthPalette.Accent,
                    modifier = Modifier.size(26.dp)
                )
            }
        } else if (secondsLeft > 0) {
            // Counts down rather than offering a dead button: a resend that silently does
            // nothing reads as the app being broken.
            Text(
                resendInLabel(secondsLeft),
                modifier = Modifier.fillMaxWidth(),
                fontSize = 13.sp,
                color = PhoneAuthPalette.TextMuted,
                textAlign = TextAlign.Center
            )
        } else {
            Text(
                resendLabel,
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { secondsLeft = 30; onResend() }
                    .padding(vertical = 8.dp),
                fontSize = 14.sp,
                fontWeight = FontWeight.Bold,
                color = PhoneAuthPalette.Accent,
                textAlign = TextAlign.Center
            )
        }
    }
}

// --- shared --------------------------------------------------------------------------

@Composable
private fun PrimaryButton(
    label: String,
    enabled: Boolean,
    loading: Boolean,
    onClick: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .height(54.dp)
            .background(
                if (enabled) PhoneAuthPalette.Accent else PhoneAuthPalette.Disabled,
                RoundedCornerShape(14.dp)
            )
            .clickable(enabled = enabled) { onClick() },
        contentAlignment = Alignment.Center
    ) {
        if (loading) {
            CircularProgressIndicator(color = Color.White, modifier = Modifier.size(22.dp))
        } else {
            Text(
                label,
                fontSize = 16.sp,
                fontWeight = FontWeight.Bold,
                color = if (enabled) Color.White else PhoneAuthPalette.TextMuted
            )
        }
    }
}
