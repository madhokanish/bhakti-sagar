import type { Metadata } from "next";
import UpiAutopayTestClient from "@/components/UpiAutopayTestClient";

export const metadata: Metadata = {
  title: "UPI AutoPay test | BhaktiChat",
  robots: { index: false, follow: false }
};

export default function UpiAutopayTestPage() {
  return (
    <div className="container py-8 md:py-12">
      <section className="mb-6 rounded-[2rem] border border-sagar-amber/20 bg-gradient-to-br from-white via-sagar-cream/60 to-sagar-sand/65 p-6 shadow-sagar-soft md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">
          Internal test — not linked from navigation
        </p>
        <h1 className="mt-2 text-4xl font-serif text-sagar-ink md:text-5xl">
          UPI AutoPay smoke test
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-sagar-ink/74 md:text-base">
          Razorpay Subscriptions in test mode. Verifies the create → mandate → webhook
          pipeline before this same backend gets a native Android checkout in front of it.
        </p>
      </section>

      <UpiAutopayTestClient />
    </div>
  );
}
