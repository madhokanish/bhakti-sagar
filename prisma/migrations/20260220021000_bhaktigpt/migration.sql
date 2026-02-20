-- CreateEnum
CREATE TYPE "BhaktiGptMessageRole" AS ENUM ('user', 'assistant', 'system');

-- CreateTable
CREATE TABLE "BhaktiGptConversation" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "guideId" TEXT NOT NULL,
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BhaktiGptConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhaktiGptMessage" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" "BhaktiGptMessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BhaktiGptMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BhaktiGptUsage" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "sessionId" TEXT,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BhaktiGptUsage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BhaktiGptConversation_userId_updatedAt_idx" ON "BhaktiGptConversation"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "BhaktiGptConversation_sessionId_updatedAt_idx" ON "BhaktiGptConversation"("sessionId", "updatedAt");

-- CreateIndex
CREATE INDEX "BhaktiGptMessage_conversationId_createdAt_idx" ON "BhaktiGptMessage"("conversationId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "BhaktiGptUsage_userId_key" ON "BhaktiGptUsage"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BhaktiGptUsage_sessionId_key" ON "BhaktiGptUsage"("sessionId");

-- AddForeignKey
ALTER TABLE "BhaktiGptConversation" ADD CONSTRAINT "BhaktiGptConversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhaktiGptMessage" ADD CONSTRAINT "BhaktiGptMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "BhaktiGptConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BhaktiGptUsage" ADD CONSTRAINT "BhaktiGptUsage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
