-- AlterTable
ALTER TABLE "User" ADD COLUMN "guestDeviceId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_guestDeviceId_key" ON "User"("guestDeviceId");
