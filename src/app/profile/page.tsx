import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/auth/SignOutButton";

const PROVIDER_LABELS: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  email: "Email"
};

export const metadata: Metadata = {
  title: "Profile | Bhakti Chat",
  robots: {
    index: false,
    follow: false
  }
};

function getProviderLabel(providerId: string) {
  return PROVIDER_LABELS[providerId] || providerId.charAt(0).toUpperCase() + providerId.slice(1);
}

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/?auth=1&callbackUrl=/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      accounts: {
        select: {
          provider: true
        }
      }
    }
  });

  if (!user) {
    redirect("/?auth=1&callbackUrl=/profile");
  }

  const linkedProviders = Array.from(new Set(user.accounts.map((account) => account.provider)));

  const createdAt = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(user.createdAt);

  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <div className="rounded-3xl border border-sagar-amber/25 bg-white p-6 shadow-[0_20px_50px_-36px_rgba(46,22,10,0.6)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/60">Profile</p>
            <h1 className="mt-1 text-2xl font-bold text-sagar-ink">Your account</h1>
          </div>
          <SignOutButton />
        </div>

        <div className="mt-6 flex items-center gap-4">
          {user.image ? (
            <img
              src={user.image}
              alt={user.name ? `${user.name} avatar` : "User avatar"}
              className="h-14 w-14 rounded-full border border-sagar-amber/25 object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-sagar-amber/25 bg-sagar-cream text-base font-semibold text-sagar-ink/75">
              {(user.name || user.email || "U").slice(0, 1).toUpperCase()}
            </div>
          )}

          <div>
            <p className="text-lg font-semibold text-sagar-ink">{user.name || "Bhakti Chat user"}</p>
            <p className="text-sm text-sagar-ink/70">{user.email || "No email available"}</p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Name</dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">{user.name || "Not set"}</dd>
          </div>

          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Email</dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">{user.email || "Not set"}</dd>
          </div>

          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Providers linked</dt>
            <dd className="mt-1 flex flex-wrap gap-2 text-sm font-medium text-sagar-ink">
              {linkedProviders.length > 0 ? (
                linkedProviders.map((providerId) => (
                  <span key={providerId} className="rounded-full border border-sagar-amber/25 px-2 py-0.5 text-xs">
                    {getProviderLabel(providerId)}
                  </span>
                ))
              ) : (
                <span>None</span>
              )}
            </dd>
          </div>

          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Member since</dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">{createdAt}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
