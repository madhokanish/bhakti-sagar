import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SignOutButton from "@/components/auth/SignOutButton";

export default async function AccountPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true }
  });

  if (!user) {
    redirect("/signin?callbackUrl=/account");
  }

  const profile =
    user.profile ||
    (await prisma.userProfile.create({
      data: {
        userId: user.id,
        displayName: user.name ?? null
      }
    }));

  return (
    <div className="container max-w-3xl py-10 sm:py-16">
      <div className="rounded-3xl border border-sagar-amber/25 bg-white p-6 shadow-[0_20px_50px_-36px_rgba(46,22,10,0.6)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/60">Account</p>
            <h1 className="mt-1 text-2xl font-bold text-sagar-ink">Your profile</h1>
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
            <p className="text-lg font-semibold text-sagar-ink">{user.name || profile.displayName || "Bhakti Sagar user"}</p>
            <p className="text-sm text-sagar-ink/70">{user.email || "No email available"}</p>
          </div>
        </div>

        <dl className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">
              Onboarding completed
            </dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">
              {profile.onboardingCompleted ? "Yes" : "No"}
            </dd>
          </div>

          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">
              Subscription status
            </dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">{profile.subscriptionStatus}</dd>
          </div>

          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Country</dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">{profile.country || "Not set"}</dd>
          </div>

          <div className="rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Locale</dt>
            <dd className="mt-1 text-sm font-medium text-sagar-ink">{profile.locale || "Not set"}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
