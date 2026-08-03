import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import UpiAutopayTestClient from "@/components/UpiAutopayTestClient";

export const metadata: Metadata = {
  title: "Subscribe | BhaktiChat",
  description: "Start your BhaktiChat membership with UPI AutoPay.",
  // Still test-mode payments under the hood — keep out of search results until live.
  robots: { index: false, follow: false }
};

export default async function UpiAutopayTestPage() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect("/?auth=1&callbackUrl=/subscribe/upi-test");
  }

  return (
    <div className="container py-8 md:py-12">
      <section className="mb-6 rounded-[2rem] border border-sagar-amber/20 bg-gradient-to-br from-white via-sagar-cream/60 to-sagar-sand/65 p-6 shadow-sagar-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
          Membership
        </p>
        <h1 className="mt-2 text-4xl font-serif text-sagar-ink md:text-5xl">
          Subscribe with UPI AutoPay
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-sagar-ink/74 md:text-base">
          Support your daily devotion and unlock the full BhaktiChat experience.
        </p>
      </section>

      <UpiAutopayTestClient email={session.user.email} />
    </div>
  );
}
