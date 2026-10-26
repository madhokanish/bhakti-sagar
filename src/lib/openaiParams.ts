// Reasoning-capable models (gpt-6-luna, gpt-5.x, o-series) reject `max_tokens` and spend hidden
// "thinking" tokens by default, which adds latency and is billed as output. We turn reasoning off
// so replies stay as fast as they were on gpt-4o-mini. Older models reject `reasoning_effort`, so
// it is only sent when the model is a reasoning model. `max_completion_tokens` works on both, which
// lets OPENAI_MODEL be switched either way without a code change.
const REASONING_MODEL_PATTERN = /^(gpt-[5-9]|o\d)/i;

export function openAiChatParams(model: string, maxTokens?: number) {
  return {
    ...(maxTokens ? { max_completion_tokens: maxTokens } : {}),
    ...(REASONING_MODEL_PATTERN.test(model) ? { reasoning_effort: "none" } : {})
  };
}
