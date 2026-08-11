import { NextResponse } from "next/server";
import { requireMobileSession } from "@/lib/mobileAuth";
import { mobileAuthErrorResponse } from "@/lib/mobileAuthResponse";
import { createHandoffToken } from "@/lib/webCheckoutHandoff";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function resolveOrigin(request: Request) {
  const configured = process.env.NEXTAUTH_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
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
