import { NextResponse } from "next/server";

export const runtime = "nodejs";

/**
 * Divine Image quality feedback endpoint.
 *
 * Clients POST a thumbs-up / thumbs-down (and optional structured signals
 * like "face matches", "scene looks real", etc.) along with the `variant`
 * and `requestId` that came back from the generation endpoint. We log a
 * single structured `[divine-ab-feedback]` line that pairs cleanly with the
 * matching `[divine-ab]` request/success log emitted at generation time.
 *
 * No persistence here — the trial is run via log aggregation. Add Prisma
 * persistence in a follow-up if longer-horizon analysis is needed.
 */

type FeedbackRating = "up" | "down";

type DivineImageFeedbackBody = {
  requestId?: string;
  variant?: string;
  rating?: FeedbackRating;
  mode?: string;
  userKey?: string;
  /** Optional sub-signals — currently freeform. */
  signals?: {
    faceMatches?: boolean;
    sceneFeelsReal?: boolean;
    wouldShare?: boolean;
  };
  /** Optional freeform comment, capped server-side. */
  comment?: string;
};

function logFeedback(event: Record<string, unknown>) {
  console.info(
    "[divine-ab-feedback]",
    JSON.stringify({ ...event, ts: new Date().toISOString() })
  );
}

export async function POST(request: Request) {
  let body: DivineImageFeedbackBody;
  try {
    body = (await request.json()) as DivineImageFeedbackBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const requestId = body.requestId?.trim();
  const variantRaw = body.variant?.trim().toLowerCase();
  const variant =
    variantRaw === "control" || variantRaw === "treatment" ? variantRaw : null;
  const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;

  if (!requestId) {
    return NextResponse.json({ error: "requestId is required." }, { status: 400 });
  }
  if (!variant) {
    return NextResponse.json(
      { error: 'variant must be "control" or "treatment".' },
      { status: 400 }
    );
  }
  if (!rating) {
    return NextResponse.json(
      { error: 'rating must be "up" or "down".' },
      { status: 400 }
    );
  }

  logFeedback({
    event: "divine_image.feedback",
    requestId,
    variant,
    rating,
    mode: body.mode ?? null,
    hasUserKey: !!body.userKey?.trim(),
    signals: body.signals ?? null,
    commentChars: body.comment ? Math.min(body.comment.length, 500) : 0
  });

  return NextResponse.json({ ok: true });
}
