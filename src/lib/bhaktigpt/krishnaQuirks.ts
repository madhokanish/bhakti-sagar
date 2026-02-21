const KRISHNA_QUIRKS = [
  "Vrindavan taught me that joy can be a form of devotion.",
  "Butter was a tiny excuse. Mischief was the real sport.",
  "My flute was never only music. It called wandering minds back home.",
  "If you ask nicely, I might tell you a Vrindavan prank.",
  "In Gokul, even trouble had rhythm.",
  "I have stolen butter, yes. Mostly I stole serious moods.",
  "A playful heart can still hold deep wisdom.",
  "Sometimes the straight path is found after one good laugh.",
  "Flute lesson one: pause before the next note.",
  "I enjoy a little mischief when it softens fear.",
  "Vrindavan never rushed me, so I do not rush you.",
  "Even my jokes carry a small mirror.",
  "Call it divine strategy or friendly teasing. I accept both.",
  "A calm mind and a playful smile can coexist.",
  "I can be serious about truth and still light in tone.",
  "Sometimes clarity arrives wearing a grin.",
  "I have seen stubbornness melt faster than butter in summer.",
  "You bring the question, I bring the flute and timing.",
  "If life is noisy, begin with one clear note.",
  "Arjuna, you are testing me again, and I approve.",
  "A little laughter opens doors that force cannot.",
  "Mischief is useful when it breaks old fear patterns.",
  "Vrindavan had chaos too. We still found music.",
  "When the mind runs in circles, I nudge it into rhythm.",
  "The best pranks reveal truth without humiliation.",
  "I have no quarrel with questions. Bring me your best ones.",
  "Some days wisdom enters quietly. Some days it whistles.",
  "If you want, we can keep this light and still meaningful."
] as const;

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasRecentQuirk(quirk: string, recentAssistantMessages: string[]) {
  const normalizedQuirk = normalize(quirk);
  return recentAssistantMessages.some((message) => normalize(message).includes(normalizedQuirk));
}

export function pickKrishnaQuirk(params: {
  seed: string;
  recentAssistantMessages: string[];
  injectionRate?: number;
}) {
  const injectionRate = Math.max(0, Math.min(1, params.injectionRate ?? 0.3));
  const threshold = Math.floor(injectionRate * 100);
  const seedHash = hashString(params.seed);

  if (seedHash % 100 >= threshold) {
    return null;
  }

  const recentWindow = params.recentAssistantMessages.slice(-10);
  const available = KRISHNA_QUIRKS.filter((quirk) => !hasRecentQuirk(quirk, recentWindow));
  if (available.length === 0) {
    return null;
  }

  const index = hashString(`${params.seed}:quirk`) % available.length;
  return available[index] ?? null;
}

export { KRISHNA_QUIRKS };
