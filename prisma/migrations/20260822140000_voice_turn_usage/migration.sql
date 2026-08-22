-- CreateTable
CREATE TABLE "VoiceTurnUsage" (
    "id" TEXT NOT NULL,
    "rateKey" TEXT NOT NULL,
    "userId" TEXT,
    "guideId" TEXT NOT NULL,
    "conversationId" TEXT,
    "model" TEXT NOT NULL,
    "durationSeconds" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VoiceTurnUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VoiceTurnUsage_createdAt_idx" ON "VoiceTurnUsage"("createdAt");

-- CreateIndex
CREATE INDEX "VoiceTurnUsage_guideId_createdAt_idx" ON "VoiceTurnUsage"("guideId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceTurnUsage_userId_createdAt_idx" ON "VoiceTurnUsage"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "VoiceTurnUsage_conversationId_idx" ON "VoiceTurnUsage"("conversationId");
