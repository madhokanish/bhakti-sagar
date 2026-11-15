package com.bhaktichat.app.data.repo

import com.bhaktichat.app.domain.DivineCreation
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import java.util.concurrent.ConcurrentHashMap

interface DivineCreationRepository {
    suspend fun upsertCreation(creation: DivineCreation)
    suspend fun getCreation(id: String): DivineCreation?
    suspend fun listCreations(limit: Int): List<DivineCreation>
    fun observeCreations(limit: Int): Flow<List<DivineCreation>>
    fun observeCreation(id: String): Flow<DivineCreation?>
    suspend fun updateFeedback(creationId: String, rating: String)
    suspend fun deleteCreation(creationId: String)
    suspend fun deleteAllCreations()

    /**
     * Runs a generation for [creationId] in an app-lifetime scope, not a ViewModel's, so leaving
     * the screen can't cancel a paid generation and strand its row in GENERATING.
     */
    fun launchGeneration(creationId: String, block: suspend () -> Unit)

    /** Cancels an in-flight [launchGeneration] (the user tapped cancel). */
    fun cancelGeneration(creationId: String)
}

class InMemoryDivineCreationRepository : DivineCreationRepository {
    private val creations = MutableStateFlow<List<DivineCreation>>(emptyList())
    // Main, like the viewModelScope these jobs used to run in: the read-modify-write upserts
    // below aren't synchronized. The generator moves its own network work onto IO.
    private val generationScope = CoroutineScope(SupervisorJob() + Dispatchers.Main)
    private val generationJobs = ConcurrentHashMap<String, Job>()

    override suspend fun upsertCreation(creation: DivineCreation) {
        val current = creations.value.toMutableList()
        val index = current.indexOfFirst { it.id == creation.id }
        if (index >= 0) {
            current[index] = creation
        } else {
            current.add(creation)
        }
        creations.value = current.sortedByDescending { it.createdAt }
    }

    override suspend fun getCreation(id: String): DivineCreation? =
        creations.value.firstOrNull { it.id == id }

    override suspend fun listCreations(limit: Int): List<DivineCreation> =
        creations.value.take(limit)

    override fun observeCreations(limit: Int): Flow<List<DivineCreation>> =
        creations.map { current -> current.take(limit) }

    override fun observeCreation(id: String): Flow<DivineCreation?> =
        creations.map { current -> current.firstOrNull { it.id == id } }

    override suspend fun updateFeedback(creationId: String, rating: String) {
        val current = creations.value.toMutableList()
        val index = current.indexOfFirst { it.id == creationId }
        if (index < 0) return
        current[index] = current[index].copy(feedbackRating = rating)
        creations.value = current.sortedByDescending { it.createdAt }
    }

    override suspend fun deleteCreation(creationId: String) {
        creations.value = creations.value.filterNot { it.id == creationId }
    }

    override suspend fun deleteAllCreations() {
        creations.value = emptyList()
    }

    override fun launchGeneration(creationId: String, block: suspend () -> Unit) {
        generationJobs.remove(creationId)?.cancel()
        val job = generationScope.launch { block() }
        generationJobs[creationId] = job
        job.invokeOnCompletion { generationJobs.remove(creationId, job) }
    }

    override fun cancelGeneration(creationId: String) {
        generationJobs.remove(creationId)?.cancel()
    }
}
