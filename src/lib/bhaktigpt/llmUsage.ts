import "server-only";

import { prisma } from "@/lib/prisma";

/** Which code path spent the tokens. Kept a closed union so reports can group on it. */
export type LlmCallSite = "chat-stream" | "chat-rewrite" | "chat-truncate";

/** The subset of OpenAI's `usage` object we care about. All fields optional — some paths omit it. */
export type OpenAiUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
};

/**
 * Records one completion's token usage.
 *
 * Fire-and-forget by design: this exists to explain the invoice, and a reporting write must
 * never be able to fail a user's reply. Callers do not await it, and every error is swallowed
 * after being logged.
 */
export function recordLlmUsage(input: {
  model: string;
  callSite: LlmCallSite;
  guideId?: string | null;
  usage?: OpenAiUsage | null;
}) {
  const usage = input.usage;
  // Nothing useful to store — don't write an empty row.
  if (!usage || (usage.prompt_tokens == null && usage.completion_tokens == null)) return;

  void prisma.llmUsage
    .create({
      data: {
        model: input.model,
        callSite: input.callSite,
        guideId: input.guideId ?? null,
        promptTokens: usage.prompt_tokens ?? null,
        completionTokens: usage.completion_tokens ?? null,
        totalTokens:
          usage.total_tokens ??
          (usage.prompt_tokens != null && usage.completion_tokens != null
            ? usage.prompt_tokens + usage.completion_tokens
            : null)
      }
    })
    .catch((error) => {
      console.error("[llmUsage] failed to record usage", error);
    });
}
