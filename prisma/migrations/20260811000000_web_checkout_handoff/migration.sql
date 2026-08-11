-- CreateTable
CREATE TABLE "WebCheckoutHandoff" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebCheckoutHandoff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebCheckoutHandoff_token_key" ON "WebCheckoutHandoff"("token");

-- CreateIndex
CREATE INDEX "WebCheckoutHandoff_userId_idx" ON "WebCheckoutHandoff"("userId");

-- AddForeignKey
ALTER TABLE "WebCheckoutHandoff" ADD CONSTRAINT "WebCheckoutHandoff_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
