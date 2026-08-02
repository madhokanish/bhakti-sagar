import { NextResponse } from "next/server";
import { MobileAuthError } from "@/lib/mobileAuth";

export function mobileAuthErrorResponse(error: unknown) {
  if (error instanceof MobileAuthError) {
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status }
    );
  }
  console.error("[Mobile auth] Unexpected error", error);
  return NextResponse.json(
    { error: "Authentication is temporarily unavailable.", code: "AUTH_UNAVAILABLE" },
    { status: 500 }
  );
}
