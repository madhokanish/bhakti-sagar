-- CreateTable
CREATE TABLE "DivineImageGeneration" (
    "id" TEXT NOT NULL,
    "userKey" TEXT,
    "userId" TEXT,
    "requestId" TEXT,
    "mode" TEXT,
    "endpoint" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "size" TEXT NOT NULL,
    "quality" TEXT,
    "inputFidelity" TEXT,
    "status" TEXT NOT NULL,
    "durationMs" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DivineImageGeneration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DivineImageGeneration_createdAt_idx" ON "DivineImageGeneration"("createdAt");

-- CreateIndex
CREATE INDEX "DivineImageGeneration_userKey_createdAt_idx" ON "DivineImageGeneration"("userKey", "createdAt");

-- CreateIndex
CREATE INDEX "DivineImageGeneration_userId_createdAt_idx" ON "DivineImageGeneration"("userId", "createdAt");
