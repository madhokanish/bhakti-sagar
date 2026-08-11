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

  const { token, expiresAt } = await createHandoffToken(userId);
  const url = `${resolveOrigin(request)}/api/checkout-handoff?token=${encodeURIComponent(token)}`;

  return NextResponse.json({ url, expiresAt: expiresAt.toISOString() });
}
