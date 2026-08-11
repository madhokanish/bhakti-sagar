import { NextResponse } from "next/server";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { createHandoffToken } from "@/lib/webCheckoutHandoff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveOrigin(request: Request) {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) {
    // NEXTAUTH_URL is set without a scheme in production ("bhaktichat.com"). auth.ts
    // normalizes it on import, but this route never imports auth.ts, so it would hand the
    // app a scheme-less URL — which Uri.parse treats as having no scheme at all, and the
    // Custom Tab then refuses to open. Normalize here rather than relying on another
    // module's import side effect having run first.
    const absolute = /^https?:\/\//i.test(configured) ? configured : `https://${configured}`;
    return absolute.replace(/\/+$/, "");
  }
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  let userId: string;
  try {
    const session = await requireMobileSession(request);
    userId = session.user.id;
  } catch (error) {
    return mobileAuthErrorResponse(error);
  }

  // The app tells us which language it is showing so checkout can match it. Anything other
  // than an explicit "hi" falls back to the app's HINGLISH, which is its default.
  let lang = "en";
  try {
    const body = (await request.json()) as { lang?: unknown };
    if (body?.lang === "hi") lang = "hi";
  } catch {
    // No body is fine — the app sends "{}" when it has nothing to say.
  }

  const { token, expiresAt } = await createHandoffToken(userId);
  const url =
    `${resolveOrigin(request)}/api/checkout-handoff` +
    `?token=${encodeURIComponent(token)}&lang=${lang}`;

  return NextResponse.json({ url, expiresAt: expiresAt.toISOString() });
}
