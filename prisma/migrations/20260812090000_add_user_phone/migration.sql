-- Phone sign-in.
--
-- Both columns are nullable and no existing row is touched: every current account is a
-- Google account and stays exactly as it is. Phone and Google accounts are deliberately
-- separate identities, so nothing here attempts to match a number to an existing user.
--
-- The unique index is what makes a number an identity: it stops two accounts ever claiming
-- the same phone. Postgres treats NULLs as distinct, so the many existing rows with a NULL
-- phone do not collide.
ALTER TABLE "User" ADD COLUMN "phone" TEXT;
ALTER TABLE "User" ADD COLUMN "phoneVerified" TIMESTAMP(3);

CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
