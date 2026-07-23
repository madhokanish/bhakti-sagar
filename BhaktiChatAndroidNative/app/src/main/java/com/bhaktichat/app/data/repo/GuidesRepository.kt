package com.bhaktichat.app.data.repo

import com.bhaktichat.app.domain.Guide
import com.bhaktichat.app.domain.Guides

interface GuidesRepository {
    fun getGuides(): List<Guide>
    fun getGuide(guideId: String): Guide?
}

class DefaultGuidesRepository : GuidesRepository {
    override fun getGuides(): List<Guide> = Guides.all

    override fun getGuide(guideId: String): Guide? = Guides.byId(guideId)
}
