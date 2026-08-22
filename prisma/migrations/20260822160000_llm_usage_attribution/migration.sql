-- AlterTable
ALTER TABLE "LlmUsage" ADD COLUMN "userId" TEXT;
ALTER TABLE "LlmUsage" ADD COLUMN "rateKey" TEXT;

-- CreateIndex
CREATE INDEX "LlmUsage_rateKey_createdAt_idx" ON "LlmUsage"("rateKey", "createdAt");

-- CreateIndex
CREATE INDEX "LlmUsage_userId_createdAt_idx" ON "LlmUsage"("userId", "createdAt");
