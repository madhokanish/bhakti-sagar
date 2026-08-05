package com.bhaktichat.app.ui.components.language

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Icon
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.bhaktichat.app.domain.AppLanguage

/**
 * First-launch language choice.
 *
 * Deliberately bilingual in its own copy — a picker written only in the language the user
 * hasn't chosen yet is a trap. Each option is labelled in its own script so it is legible
 * to the person who wants it, without anyone having to read the other one.
 *
 * "English" here means [AppLanguage.HINGLISH]: Latin script with devotional words kept as
 * they are. See LanguageStore's note on why that is the honest label for it.
 *
 * Non-dismissible: there is no correct default to fall back to, and the choice is one tap.
 */
@Composable
fun LanguagePickerSheet(
    current: AppLanguage?,
    onSelect: (AppLanguage) -> Unit
) {
    Dialog(onDismissRequest = { /* choice is required */ }) {
        Surface(
            shape = RoundedCornerShape(28.dp),
            color = LanguagePalette.Sheet
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 22.dp, vertical = 26.dp)
            ) {
                Text(
                    text = "भाषा चुनें",
                    fontSize = 21.sp,
                    fontWeight = FontWeight.ExtraBold,
                    color = LanguagePalette.TextPrimary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                Text(
                    text = "Choose your language",
                    fontSize = 13.sp,
                    color = LanguagePalette.TextSecondary,
                    textAlign = TextAlign.Center,
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 4.dp)
                )

                Column(
                    modifier = Modifier.padding(top = 20.dp),
                    verticalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    LanguageOption(
                        title = "हिंदी",
                        selected = current == AppLanguage.HINDI,
                        onClick = { onSelect(AppLanguage.HINDI) }
                    )
                    LanguageOption(
                        title = "English",
                        selected = current == AppLanguage.HINGLISH,
                        onClick = { onSelect(AppLanguage.HINGLISH) }
                    )
                }
            }
        }
    }
}

@Composable
private fun LanguageOption(
    title: String,
    selected: Boolean,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(16.dp),
        color = if (selected) LanguagePalette.SelectedFill else LanguagePalette.OptionFill,
        border = BorderStroke(
            width = if (selected) 2.dp else 1.dp,
            color = if (selected) LanguagePalette.Accent else LanguagePalette.OptionBorder
        )
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 18.dp, vertical = 15.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                modifier = Modifier.weight(1f),
                text = title,
                fontSize = 18.sp,
                fontWeight = FontWeight.Bold,
                color = LanguagePalette.TextPrimary
            )
            if (selected) {
                Box(
                    modifier = Modifier
                        .size(24.dp)
                        .clip(RoundedCornerShape(12.dp))
                        .background(LanguagePalette.Accent),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Filled.Check,
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(15.dp)
                    )
                }
            }
        }
    }
}

private object LanguagePalette {
    val Sheet = Color(0xFFFFFDF9)
    val OptionFill = Color(0xFFFFFFFF)
    val OptionBorder = Color(0x1A784028)
    val SelectedFill = Color(0xFFFFF3E8)
    val Accent = Color(0xFFEA580C)
    val TextPrimary = Color(0xFF2A1C15)
    val TextSecondary = Color(0xFF8A6F5C)
    val TextMuted = Color(0xFFBDA491)
}
