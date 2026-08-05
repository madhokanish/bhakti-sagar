package com.bhaktichat.app.data.local

import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.sqlite.db.SupportSQLiteDatabase
import androidx.room.migration.Migration

@Database(
    entities = [MessageEntity::class, ThreadEntity::class],
    version = 4,
    exportSchema = true
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun messageDao(): MessageDao
    abstract fun threadDao(): ThreadDao
}

/**
 * BhaktiChat 2.0: one conversation per deity. Adds `isArchived` to hide collapsed pre-2.0
 * duplicate threads from the conversation list without deleting them (see
 * ThreadsRepository.collapseDuplicateThreadsIfNeeded). Additive only — no data loss.
 */
val MIGRATION_3_4 = object : Migration(3, 4) {
    override fun migrate(db: SupportSQLiteDatabase) {
        db.execSQL("ALTER TABLE threads ADD COLUMN isArchived INTEGER NOT NULL DEFAULT 0")
    }
}
