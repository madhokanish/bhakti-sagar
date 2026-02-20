-- Guide-scoped conversation retrieval indexes for BhaktiGPT
DROP INDEX IF EXISTS "BhaktiGptConversation_userId_updatedAt_idx";
DROP INDEX IF EXISTS "BhaktiGptConversation_sessionId_updatedAt_idx";

CREATE INDEX "BhaktiGptConversation_userId_guideId_updatedAt_idx"
ON "BhaktiGptConversation"("userId", "guideId", "updatedAt");

CREATE INDEX "BhaktiGptConversation_sessionId_guideId_updatedAt_idx"
ON "BhaktiGptConversation"("sessionId", "guideId", "updatedAt");

CREATE INDEX "BhaktiGptConversation_guideId_updatedAt_idx"
ON "BhaktiGptConversation"("guideId", "updatedAt");
