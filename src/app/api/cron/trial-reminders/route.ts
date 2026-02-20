import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatRenewalPrice, hasSubscriptionEntitlement, type SupportedCurrency } from "@/lib/subscription";
import { getManageSubscriptionUrl, sendTrialReminderEmail } from "@/lib/email";

export const runtime = "nodejs";

function dayDeltaWindow(days: number) {
  const now = new Date();
  const start = new Date(now.getTime() + (days - 0.5) * 24 * 60 * 60 * 1000);
  const end = new Date(now.getTime() + (days + 0.5) * 24 * 60 * 60 * 1000);
  return { start, end };
}

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET?.trim();
  const authHeader = request.headers.get("authorization");
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Array<{ email: string; daysLeft: number; sent: boolean; reason: string }> = [];
  const manageUrl = getManageSubscriptionUrl();

  for (const daysLeft of [3, 1]) {
    const { start, end } = dayDeltaWindow(daysLeft);
    const reminderField = daysLeft === 3 ? "reminder3DaySentAt" : "reminder1DaySentAt";

    const users = await prisma.user.findMany({
      where: {
        trialEnd: {
          gte: start,
          lte: end
        },
        subscriptionStatus: {
          in: ["trialing", "active"]
        },
        [reminderField]: null
      }
    });

    for (const user of users) {
      if (!hasSubscriptionEntitlement(user.subscriptionStatus)) continue;
      if (!user.email) continue;
      const currency = (user.currency || "GBP") as SupportedCurrency;
      const sendResult = await sendTrialReminderEmail({
        email: user.email,
        trialEnd: user.trialEnd ?? new Date(),
        renewalPrice: formatRenewalPrice(currency),
        manageUrl
      });

      results.push({
        email: user.email,
        daysLeft,
        sent: sendResult.sent,
        reason: sendResult.reason
      });

      if (sendResult.sent) {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            [reminderField]: new Date()
          }
        });
      }
    }
  }

  return NextResponse.json({ ok: true, processed: results.length, results });
}
