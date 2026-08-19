-- CreateTable
CREATE TABLE "SubscriptionStatusChange" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fromStatus" TEXT NOT NULL,
    "toStatus" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionStatusChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionStatusChange_userId_createdAt_idx" ON "SubscriptionStatusChange"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionStatusChange_createdAt_idx" ON "SubscriptionStatusChange"("createdAt");

-- AddForeignKey
ALTER TABLE "SubscriptionStatusChange" ADD CONSTRAINT "SubscriptionStatusChange_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
