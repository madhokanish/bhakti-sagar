package com.bhaktichat.app.data.repo

import com.bhaktichat.app.domain.DivineCreation
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.map

interface DivineCreationRepository {
    suspend fun upsertCreation(creation: DivineCreation)
    suspend fun getCreation(id: String): DivineCreation?
    suspend fun listCreations(limit: Int): List<DivineCreation>
    fun observeCreations(limit: Int): Flow<List<DivineCreation>>
    fun observeCreation(id: String): Flow<DivineCreation?>
    suspend fun updateFeedback(creationId: String, rating: String)
    suspend fun deleteCreation(creationId: String)
    suspend fun deleteAllCreations()
}

class InMemoryDivineCreationRepository : DivineCreationRepository {
    private val creations = MutableStateFlow<List<DivineCreation>>(emptyList())

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
}
