package com.bhaktichat.app.ui.screens.home

import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TopAppBar
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.bhaktichat.app.R
import com.bhaktichat.app.data.repo.AartiRepository
import com.bhaktichat.app.domain.Aarti
import com.bhaktichat.app.domain.Deity
import com.bhaktichat.app.domain.Guides
import com.bhaktichat.app.ui.components.home.AartiPreviewList
import com.bhaktichat.app.ui.components.home.GuideCarousel
import com.bhaktichat.app.ui.components.home.HomeHeroCard
import com.bhaktichat.app.ui.components.home.SectionHeader
import com.bhaktichat.app.ui.components.home.TodayQuickActions

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    aartiRepository: AartiRepository,
    lastSelectedGuideId: String?,
    hasRecentConversation: Boolean,
    onOpenHeroChat: (String) -> Unit,
    onGuideSelected: (String) -> Unit,
    onSeeAllGuides: () -> Unit,
    onOpenAartis: () -> Unit,
    onOpenAarti: (String) -> Unit,
    onOpenChoghadiya: () -> Unit,
    onOpenChatQuickAction: (String) -> Unit,
    onOpenProfile: () -> Unit
) {
    var aartis by remember { mutableStateOf<List<Aarti>>(emptyList()) }

    LaunchedEffect(Unit) {
        aartis = aartiRepository.loadAartis()
    }

    val heroGuide = remember(lastSelectedGuideId) {
        Guides.byId(lastSelectedGuideId ?: "krishna") ?: Guides.byId("krishna") ?: Guides.all.first()
    }
    val sortedAartis = remember(aartis) {
        aartis.sortedWith(
            compareByDescending<Aarti> { it.isTop }
                .thenByDescending { it.popularityCount ?: 0L }
                .thenBy { it.title }
        )
    }
    val topAartis = remember(sortedAartis) {
        val preferredDeities = listOf(Deity.LAKSHMI, Deity.GANESH, Deity.SHIV)
        val selected = preferredDeities.mapNotNull { deity ->
            sortedAartis.firstOrNull { it.deity == deity }
        }.distinctBy { it.id }

        if (selected.isNotEmpty()) {
            selected
        } else {
            sortedAartis.take(3)
        }
    }
    val featuredAarti = topAartis.firstOrNull()
    val previewAartis = topAartis.drop(1)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(MaterialTheme.colorScheme.background)
    ) {
        TopAppBar(
            title = {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp)
                ) {
                    Image(
                        painter = painterResource(id = R.drawable.bhaktichat_logo),
                        contentDescription = "BhaktiChat logo",
                        modifier = Modifier.size(36.dp)
                    )
                    Text(
                        text = "BhaktiChat",
                        style = MaterialTheme.typography.titleLarge,
                        fontWeight = FontWeight.SemiBold
                    )
                }
            },
            actions = {
                IconButton(onClick = onOpenProfile) {
                    Icon(
                        imageVector = Icons.Outlined.Person,
                        contentDescription = "Profile"
                    )
                }
            }
        )

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 14.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp)
        ) {
            item("hero") {
                HomeHeroCard(
                    title = "Ask ${heroGuide.displayName}",
                    subtitle = heroSubtitle(guideId = heroGuide.id),
                    supportingText = if (hasRecentConversation) "Return to your last conversation." else null,
                    ctaLabel = if (hasRecentConversation) "Continue chat" else "Start chat",
                    imageRes = if (heroGuide.id == "krishna") R.drawable.hero_new else heroGuide.profileImageRes,
                    onClick = { onOpenHeroChat(heroGuide.id) }
                )
            }

            item("today-title") {
                SectionHeader(title = "Today")
            }

            item("today-actions") {
                TodayQuickActions(
                    onOpenGuidance = {
                        onOpenChatQuickAction("Give me a 1 minute reflection for today")
                    },
                    onOpenChoghadiya = onOpenChoghadiya
                )
            }

            item("guides-title") {
                SectionHeader(
                    title = "Choose your guide",
                    actionLabel = "See all",
                    onActionClick = onSeeAllGuides
                )
            }

            item("guides") {
                GuideCarousel(
                    guides = Guides.all,
                    onGuideSelected = onGuideSelected
                )
            }

            item("aarti-preview") {
                AartiPreviewList(
                    featuredAarti = featuredAarti,
                    otherAartis = previewAartis,
                    onOpenAarti = onOpenAarti,
                    onOpenAllAartis = onOpenAartis
                )
            }
        }
    }
}

private fun heroSubtitle(guideId: String): String = when (guideId) {
    "krishna" -> "Gita inspired clarity for today."
    "lakshmi" -> "Steady guidance for gratitude and abundance."
    "shani" -> "Calm discipline for slow and difficult days."
    else -> "A calm space for devotional reflection."
}
