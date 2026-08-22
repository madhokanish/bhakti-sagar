-- CreateTable
CREATE TABLE "VoiceUsageDaily" (
    "id" TEXT NOT NULL,
    "rateKey" TEXT NOT NULL,
    "day" TEXT NOT NULL,
    "minutesUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VoiceUsageDaily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "VoiceUsageDaily_rateKey_day_key" ON "VoiceUsageDaily"("rateKey", "day");

-- CreateIndex
CREATE INDEX "VoiceUsageDaily_day_idx" ON "VoiceUsageDaily"("day");

-- CreateTable
CREATE TABLE "LlmUsage" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "callSite" TEXT NOT NULL,
    "guideId" TEXT,
    "promptTokens" INTEGER,
    "completionTokens" INTEGER,
    "totalTokens" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LlmUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LlmUsage_createdAt_idx" ON "LlmUsage"("createdAt");

-- CreateIndex
CREATE INDEX "LlmUsage_model_createdAt_idx" ON "LlmUsage"("model", "createdAt");

-- CreateIndex
CREATE INDEX "LlmUsage_callSite_createdAt_idx" ON "LlmUsage"("callSite", "createdAt");
