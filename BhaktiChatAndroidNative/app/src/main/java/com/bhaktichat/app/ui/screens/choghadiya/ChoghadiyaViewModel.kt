package com.bhaktichat.app.ui.screens.choghadiya

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewModelScope
import com.bhaktichat.app.data.repo.ChoghadiyaDayData
import com.bhaktichat.app.data.repo.ChoghadiyaRepository
import com.bhaktichat.app.domain.ChoghadiyaCities
import com.bhaktichat.app.domain.ChoghadiyaCity
import com.bhaktichat.app.domain.ChoghadiyaSlot
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import java.time.Duration
import java.time.LocalDate
import java.time.ZoneId
import java.time.format.DateTimeFormatter
import java.util.Locale

enum class KaalTone {
    AUSPICIOUS,
    NEUTRAL,
    CHALLENGING
}

/** Shared with Home's live Choghadiya preview row, which computes a tone straight from a
 *  repository-fetched slot rather than through this screen's ViewModel. */
fun kaalToneFor(baseLabel: String): KaalTone = when (baseLabel) {
    "Shubh", "Labh", "Amrit" -> KaalTone.AUSPICIOUS
    "Char" -> KaalTone.NEUTRAL
    else -> KaalTone.CHALLENGING
}

data class CurrentKaalUi(
    val displayLabel: String,
    val timeRange: String,
    val guidanceKey: String,
    val tone: KaalTone,
    val progress: Float
)

data class NextGoodKaalUi(
    val displayLabel: String,
    val start: String,
    val startsAt: String,
    val countdownHours: Long,
    val countdownMinutes: Long
)

data class TimelineItemUi(
    val id: String,
    val title: String,
    val timeRange: String,
    val meaningKey: String,
    val tone: KaalTone,
    val isCurrent: Boolean,
    val isFuture: Boolean
)

data class ChoghadiyaUiState(
    val currentKaal: CurrentKaalUi? = null,
    val nextGoodKaal: NextGoodKaalUi? = null,
    val timelineList: List<TimelineItemUi> = emptyList(),
    val selectedCity: ChoghadiyaCity = ChoghadiyaCities.recommendedCity(),
    val filteredCities: List<ChoghadiyaCity> = ChoghadiyaCities.all,
    val recentCities: List<ChoghadiyaCity> = listOf(ChoghadiyaCities.recommendedCity()),
    val searchQuery: String = "",
    val loading: Boolean = true,
    val error: String? = null,
    val sunrise: String = "--",
    val sunset: String = "--",
    val nextSunrise: String = "--",
    val todayLabel: String = "",
    val isCitySheetOpen: Boolean = false
)

class ChoghadiyaViewModel(
    private val repository: ChoghadiyaRepository
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        ChoghadiyaUiState(
            selectedCity = ChoghadiyaCities.recommendedCity(),
            recentCities = listOf(ChoghadiyaCities.recommendedCity())
        )
    )
    val uiState: StateFlow<ChoghadiyaUiState> = _uiState.asStateFlow()

    private var selectedCity: ChoghadiyaCity = ChoghadiyaCities.recommendedCity()
    private var searchQuery: String = ""
    private var isCitySheetOpen: Boolean = false
    private var isLoading: Boolean = true
    private var errorMessage: String? = null
    private var latestDayData: ChoghadiyaDayData? = null
    private var recentCitySlugs: List<String> = listOf(selectedCity.slug)
    private var loadJob: Job? = null

    init {
        loadForSelectedCity()
        startTicker()
    }

    fun onOpenCitySelector() {
        isCitySheetOpen = true
        publishState()
    }

    fun onDismissCitySelector() {
        isCitySheetOpen = false
        searchQuery = ""
        publishState()
    }

    fun onSearchQueryChanged(value: String) {
        searchQuery = value
        publishState()
    }

    fun onCitySelected(city: ChoghadiyaCity) {
        selectedCity = city
        isCitySheetOpen = false
        searchQuery = ""
        recentCitySlugs = listOf(city.slug) + recentCitySlugs.filterNot { it == city.slug }.take(2)
        loadForSelectedCity()
    }

    fun onAutoDetectCity() {
        onCitySelected(ChoghadiyaCities.recommendedCity())
    }

    private fun loadForSelectedCity() {
        loadJob?.cancel()
        loadJob = viewModelScope.launch {
            val cityAtRequest = selectedCity
            isLoading = true
            errorMessage = null
            publishState()

            runCatching {
                repository.loadToday(cityAtRequest)
            }.onSuccess { result ->
                if (selectedCity.slug != cityAtRequest.slug) return@onSuccess
                latestDayData = result
                isLoading = false
                errorMessage = null
                publishState()
            }.onFailure { throwable ->
                if (selectedCity.slug != cityAtRequest.slug) return@onFailure
                latestDayData = null
                isLoading = false
                errorMessage = "अभी चौघड़िया लोड नहीं हो सका। कृपया फिर प्रयास करें।"
                publishState()
            }
        }
    }

    private fun startTicker() {
        viewModelScope.launch {
            while (isActive) {
                publishState()
                delay(millisUntilNextMinute())
            }
        }
    }

    private fun millisUntilNextMinute(): Long {
        val now = System.currentTimeMillis()
        return (60_000L - (now % 60_000L)).coerceAtLeast(1_000L)
    }

    private fun publishState() {
        val now = System.currentTimeMillis()
        val filteredCities = filterCities(searchQuery)
        val recentCities = recentCitySlugs.mapNotNull { slug ->
            ChoghadiyaCities.all.firstOrNull { it.slug == slug }
        }

        val dayData = latestDayData
        val currentSlot = dayData?.slots?.firstOrNull { now >= it.startEpochMillis && now < it.endEpochMillis }
            ?: dayData?.slots?.firstOrNull { it.endEpochMillis > now }
            ?: dayData?.slots?.lastOrNull()

        val nextGoodSlot = dayData?.slots?.firstOrNull {
            it.startEpochMillis > now && isAuspicious(it)
        }

        val timeline = dayData?.slots?.map { slot ->
            TimelineItemUi(
                id = "${slot.label}_${slot.startEpochMillis}",
                title = slot.displayLabel,
                timeRange = "${slot.start} से ${slot.end} तक",
                meaningKey = timelineMeaningKey(slot),
                tone = toneFor(slot),
                isCurrent = currentSlot?.startEpochMillis == slot.startEpochMillis,
                isFuture = slot.startEpochMillis > now
            )
        }.orEmpty()

        _uiState.value = ChoghadiyaUiState(
            currentKaal = currentSlot?.toCurrentKaalUi(now),
            nextGoodKaal = nextGoodSlot?.toNextGoodKaalUi(now),
            timelineList = timeline,
            selectedCity = selectedCity,
            filteredCities = filteredCities,
            recentCities = recentCities,
            searchQuery = searchQuery,
            loading = isLoading,
            error = errorMessage,
            sunrise = dayData?.sunrise ?: "--",
            sunset = dayData?.sunset ?: "--",
            nextSunrise = dayData?.nextSunrise ?: "--",
            todayLabel = LocalDate.now(ZoneId.of(selectedCity.tz))
                .format(DateTimeFormatter.ofPattern("EEEE, d MMMM", Locale.forLanguageTag("hi-IN"))),
            isCitySheetOpen = isCitySheetOpen
        )
    }

    private fun filterCities(query: String): List<ChoghadiyaCity> {
        if (query.isBlank()) return ChoghadiyaCities.all
        return ChoghadiyaCities.all.filter { city ->
            city.name.contains(query.trim(), ignoreCase = true)
        }
    }

    private fun ChoghadiyaSlot.toCurrentKaalUi(now: Long): CurrentKaalUi {
        val totalDuration = (endEpochMillis - startEpochMillis).coerceAtLeast(1L)
        val elapsed = (now - startEpochMillis).coerceAtLeast(0L).coerceAtMost(totalDuration)
        return CurrentKaalUi(
            displayLabel = displayLabel,
            timeRange = "$start से $end तक",
            guidanceKey = currentGuidanceKey(this),
            tone = toneFor(this),
            progress = (elapsed.toFloat() / totalDuration.toFloat()).coerceIn(0f, 1f)
        )
    }

    private fun ChoghadiyaSlot.toNextGoodKaalUi(now: Long): NextGoodKaalUi {
        val remaining = (startEpochMillis - now).coerceAtLeast(0L)
        val duration = Duration.ofMillis(remaining)
        val hours = duration.toHours()
        val minutes = duration.minusHours(hours).toMinutes()
        return NextGoodKaalUi(
            displayLabel = displayLabel,
            start = start,
            startsAt = "$start से $end तक",
            countdownHours = hours,
            countdownMinutes = minutes
        )
    }

    private fun isAuspicious(slot: ChoghadiyaSlot): Boolean {
        return slot.baseLabel in setOf("Shubh", "Labh", "Amrit")
    }

    private fun toneFor(slot: ChoghadiyaSlot): KaalTone = kaalToneFor(slot.baseLabel)

    private fun currentGuidanceKey(slot: ChoghadiyaSlot): String {
        return when (slot.baseLabel) {
            "Shubh" -> "choghadiya_guidance_shubh"
            "Labh" -> "choghadiya_guidance_labh"
            "Amrit" -> "choghadiya_guidance_amrit"
            "Char" -> "choghadiya_guidance_char"
            "Rog" -> "choghadiya_guidance_rog"
            "Kaal" -> "choghadiya_guidance_kaal"
            else -> "choghadiya_guidance_udveg"
        }
    }

    private fun timelineMeaningKey(slot: ChoghadiyaSlot): String {
        return when (slot.baseLabel) {
            "Shubh" -> "choghadiya_meaning_shubh"
            "Labh" -> "choghadiya_meaning_labh"
            "Amrit" -> "choghadiya_meaning_amrit"
            "Char" -> "choghadiya_meaning_char"
            "Rog" -> "choghadiya_meaning_rog"
            "Kaal" -> "choghadiya_meaning_kaal"
            else -> "choghadiya_meaning_udveg"
        }
    }
}

class ChoghadiyaViewModelFactory(
    private val repository: ChoghadiyaRepository
) : ViewModelProvider.Factory {
    @Suppress("UNCHECKED_CAST")
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(ChoghadiyaViewModel::class.java)) {
            return ChoghadiyaViewModel(repository) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
