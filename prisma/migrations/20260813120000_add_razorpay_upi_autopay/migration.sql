-- Direct Razorpay UPI AutoPay mandates and their scheduled debit attempts.
CREATE TABLE "RazorpayAutopayMandate" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "razorpayCustomerId" TEXT NOT NULL,
    "customerContact" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT NOT NULL,
    "razorpayTokenId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "authorizationAmount" INTEGER NOT NULL,
    "billingAmount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "frequency" TEXT NOT NULL DEFAULT 'monthly',
    "nextBillingAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "cancellationRequestedAt" TIMESTAMP(3),
    "lastCheckedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RazorpayAutopayMandate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RazorpayAutopayCharge" (
    "id" TEXT NOT NULL,
    "mandateId" TEXT NOT NULL,
    "razorpayOrderId" TEXT NOT NULL,
    "razorpayPaymentId" TEXT,
    "amount" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'created',
    "scheduledFor" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RazorpayAutopayCharge_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RazorpayAutopayMandate_razorpayOrderId_key" ON "RazorpayAutopayMandate"("razorpayOrderId");
CREATE UNIQUE INDEX "RazorpayAutopayMandate_razorpayPaymentId_key" ON "RazorpayAutopayMandate"("razorpayPaymentId");
CREATE UNIQUE INDEX "RazorpayAutopayMandate_razorpayTokenId_key" ON "RazorpayAutopayMandate"("razorpayTokenId");
CREATE INDEX "RazorpayAutopayMandate_userId_status_idx" ON "RazorpayAutopayMandate"("userId", "status");
CREATE INDEX "RazorpayAutopayMandate_status_nextBillingAt_idx" ON "RazorpayAutopayMandate"("status", "nextBillingAt");
CREATE UNIQUE INDEX "RazorpayAutopayCharge_razorpayOrderId_key" ON "RazorpayAutopayCharge"("razorpayOrderId");
CREATE UNIQUE INDEX "RazorpayAutopayCharge_razorpayPaymentId_key" ON "RazorpayAutopayCharge"("razorpayPaymentId");
CREATE UNIQUE INDEX "RazorpayAutopayCharge_mandateId_scheduledFor_key" ON "RazorpayAutopayCharge"("mandateId", "scheduledFor");
CREATE INDEX "RazorpayAutopayCharge_status_scheduledFor_idx" ON "RazorpayAutopayCharge"("status", "scheduledFor");
ALTER TABLE "RazorpayAutopayMandate" ADD CONSTRAINT "RazorpayAutopayMandate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RazorpayAutopayCharge" ADD CONSTRAINT "RazorpayAutopayCharge_mandateId_fkey" FOREIGN KEY ("mandateId") REFERENCES "RazorpayAutopayMandate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
