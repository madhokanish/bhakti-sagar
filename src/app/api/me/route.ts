import { NextResponse } from "next/server";
import { getRequestEntitlement } from "@/lib/subscription";

export const runtime = "nodejs";

export async function GET() {
  const entitlement = await getRequestEntitlement();

  return NextResponse.json({
    isEntitled: entitlement.isEntitled,
    email: entitlement.user?.email ?? null,
    subscriptionStatus: entitlement.user?.subscriptionStatus ?? "inactive",
    currency: entitlement.currency
  });
}
