import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { hasSubscriptionEntitlement } from "@/lib/subscription";
import UpiAutopayTestClient from "@/components/UpiAutopayTestClient";
import ProSubscriptionStatus from "@/components/ProSubscriptionStatus";
import { resolveCheckoutLang } from "@/lib/chadhaavaCopy";

export const metadata: Metadata = {
  title: "Subscribe | BhaktiChat",
  description: "Start your BhaktiChat membership with UPI AutoPay.",
  // Still test-mode payments under the hood — keep out of search results until live.
  robots: { index: false, follow: false }
};

export default async function UpiAutopayTestPage({
  searchParams
}: {
  searchParams: { lang?: string };
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/?auth=1&callbackUrl=/subscribe/upi-test");
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  const isPro = hasSubscriptionEntitlement(user?.subscriptionStatus);
  const lang = resolveCheckoutLang(searchParams?.lang);

  // No page header above the offer, deliberately. In the app this is a tab the user is
  // already inside, so a "Subscribe with UPI AutoPay" title here would announce a new
  // destination and push the ₹5 below the fold on a phone.
  return (
    <div className="container py-6 md:py-10">
      {isPro ? (
        <ProSubscriptionStatus
          status={user!.subscriptionStatus}
          currentPeriodEnd={user!.currentPeriodEnd ? user!.currentPeriodEnd.toISOString() : null}
        />
      ) : (
        <UpiAutopayTestClient email={session.user.email} lang={lang} />
      )}
    </div>
  );
}
