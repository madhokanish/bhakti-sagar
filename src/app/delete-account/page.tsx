import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Delete your BhaktiChat account",
  description: "Request deletion of your BhaktiChat account and associated data.",
  robots: { index: true, follow: true }
};

export default function DeleteAccountPage() {
  const subject = encodeURIComponent("BhaktiChat account deletion request");
  const body = encodeURIComponent(
    "Please delete my BhaktiChat account and associated data.\n\nGoogle account email: \n"
  );

  return (
    <main className="container max-w-3xl py-12 sm:py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-rose">Account privacy</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">Delete your BhaktiChat account</h1>
      <p className="mt-4 text-sm leading-7 text-sagar-ink/75">
        Android users can delete their account directly in the app from Settings → Account → Delete
        account. If you no longer have the app, use the request link below. Deleting BhaktiChat does not
        delete your Google Account.
      </p>

      <section className="mt-8 rounded-2xl border border-sagar-amber/25 bg-white p-5">
        <h2 className="text-lg font-semibold text-sagar-ink">Request deletion without the app</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6 text-sagar-ink/75">
          <li>Email us from the Google email address used for BhaktiChat.</li>
          <li>Use the subject “BhaktiChat account deletion request”.</li>
          <li>We may ask you to confirm ownership before deletion.</li>
        </ol>
        <a
          href={`mailto:support@bhaktichat.com?subject=${subject}&body=${body}`}
          className="mt-5 inline-flex rounded-xl bg-sagar-ink px-4 py-2.5 text-sm font-semibold text-white"
        >
          Email account deletion request
        </a>
      </section>

      <section className="mt-6 text-sm leading-6 text-sagar-ink/75">
        <h2 className="font-semibold text-sagar-ink">What is deleted</h2>
        <p className="mt-2">
          We delete your BhaktiChat profile, authentication sessions, saved server conversations and
          associated usage data. Security records may be retained only after personal identifiers are
          removed. Payment records may be retained where legally required. Active subscriptions must be
          cancelled before account deletion so that future charges stop.
        </p>
        <p className="mt-4">
          Read our <Link href="/privacy" className="font-semibold underline underline-offset-2">Privacy Policy</Link>
          {" "}or contact support@bhaktichat.com for help.
        </p>
      </section>
    </main>
  );
}
