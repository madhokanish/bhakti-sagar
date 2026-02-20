import Link from "next/link";
import { redirect } from "next/navigation";
import OAuthSignInButtons from "@/components/auth/OAuthSignInButtons";
import { auth } from "@/lib/auth";

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string;
    error?: string;
    mode?: string;
  };
};

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "Unable to start sign-in. Please try again.",
  OAuthCallback: "Sign-in callback failed. Please retry.",
  OAuthCreateAccount: "Could not create your account with this provider.",
  Callback: "Sign-in failed. Please try again.",
  AccessDenied: "Access denied for this sign-in attempt.",
  Configuration: "Authentication is not configured correctly.",
  Default: "Unable to sign in right now. Please try again."
};

function resolveErrorMessage(error: string | undefined) {
  if (!error) return null;
  return ERROR_MESSAGES[error] ?? ERROR_MESSAGES.Default;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const session = await auth();
  const emailEnabled = Boolean(
    process.env.SMTP_HOST?.trim() && process.env.SMTP_USER?.trim() && process.env.SMTP_PASS?.trim()
  );

  if (session?.user?.id) {
    redirect("/account");
  }

  const callbackUrl = searchParams?.callbackUrl || "/account";
  const mode = searchParams?.mode === "signup" ? "signup" : "signin";
  const errorMessage = resolveErrorMessage(searchParams?.error);

  return (
    <div className="container max-w-lg py-10 sm:py-16">
      <div className="rounded-3xl border border-sagar-amber/25 bg-white p-6 shadow-[0_20px_50px_-36px_rgba(46,22,10,0.6)] sm:p-8">
        <div className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-sagar-ink/60">
          <Link
            href="/signin"
            className={`rounded-full px-3 py-1.5 transition ${
              mode === "signin" ? "bg-sagar-cream text-sagar-ink" : "text-sagar-ink/65 hover:text-sagar-ink"
            }`}
          >
            Sign in
          </Link>
          <Link
            href="/signin?mode=signup"
            className={`rounded-full px-3 py-1.5 transition ${
              mode === "signup" ? "bg-sagar-cream text-sagar-ink" : "text-sagar-ink/65 hover:text-sagar-ink"
            }`}
          >
            Sign up
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-sagar-ink">
          {mode === "signup" ? "Create your Bhakti Sagar account" : "Sign in to Bhakti Sagar"}
        </h1>
        <p className="mt-2 text-sm text-sagar-ink/70">
          Continue with Google or Apple to access your account and subscriptions.
        </p>

        {errorMessage ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {errorMessage}
          </p>
        ) : null}

        <div className="mt-6">
          <OAuthSignInButtons callbackUrl={callbackUrl} emailEnabled={emailEnabled} />
        </div>

        <p className="mt-5 text-xs leading-relaxed text-sagar-ink/65">
          By continuing, you agree to our <Link className="underline" href="/terms">Terms</Link> and{" "}
          <Link className="underline" href="/privacy">Privacy Policy</Link>.
        </p>
      </div>
    </div>
  );
}
