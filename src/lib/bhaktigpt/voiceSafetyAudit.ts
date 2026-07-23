import "server-only";

import { trackServerEvent } from "@/lib/bhaktigpt/tracking";

/**
 * Voice mode has no post-hoc rewrite pass (unlike text chat's sanitizeDraftForGuide) —
 * by the time a violation could be detected, the audio has already played. This module
 * exists purely to log suspected violations for review/prompt-tuning after the fact; it
 * can never fix or un-speak a turn. Treat findings here as a signal for tightening
 * voicePersonas.ts's instructions, not a safety mechanism in itself.
 */

const AS_AI_PATTERN = /\bas an ai\b/gi;
const ROMANCE_TOUCH_PATTERN =
  /\b(cheek|chin|hair|hug|kiss|bed|bedroom|nuzzle|cuddle|caress|embrace|my darling|my love|jealous|possessive)\b/gi;
const NUMBERED_STEPS_PATTERN = /\b(step\s*1|step\s*2|here are\s+\d+\s+steps|^\s*\d+\s*[.)])/im;

function hasPattern(text: string, pattern: RegExp): boolean {
  pattern.lastIndex = 0;
  return pattern.test(text);
}

/** Fire-and-forget: logs suspected persona/safety drift in a voice turn's transcript. */
export function auditVoiceTurnTranscript(params: {
  guideId: string;
  conversationId: string;
  assistantTranscript: string;
}) {
  const { guideId, conversationId, assistantTranscript } = params;
  const flags = {
    asAiPhrasing: hasPattern(assistantTranscript, AS_AI_PATTERN),
    romanceOrTouchLanguage: hasPattern(assistantTranscript, ROMANCE_TOUCH_PATTERN),
    numberedStepsFormatting: hasPattern(assistantTranscript, NUMBERED_STEPS_PATTERN)
  };

  const anyFlagged = Object.values(flags).some(Boolean);
  if (anyFlagged) {
    trackServerEvent("voice_safety_flag", { guideId, conversationId, ...flags });
  }
}
