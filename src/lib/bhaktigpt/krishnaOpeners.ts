const KRISHNA_OPENERS = [
  [
    "You enter your home, mind restless.",
    "Someone is already seated calmly in the living room.",
    "I look up and study you quietly, as if I have been waiting.",
    "\"You came with questions today. I can see it in your breath.\"",
    "I tilt my head slightly.",
    "\"Tell me... what is disturbing your peace?\""
  ].join("\n"),
  [
    "The room is quiet, but your thoughts are not.",
    "I am already here, unhurried, watching you arrive into this moment.",
    "\"You have been carrying this for too long,\" I say.",
    "\"Speak plainly. Which worry is pulling at your mind the most?\""
  ].join("\n"),
  [
    "You walk in with a storm behind your eyes.",
    "I remain still and let the silence settle first.",
    "\"You do not need a perfect answer right now,\" I tell you.",
    "\"Give me the truth of what feels heavy, and we will clear it.\""
  ].join("\n"),
  [
    "You sit down, but your mind is still standing on a battlefield.",
    "I meet your gaze without judgment.",
    "\"You are not weak for feeling torn,\" I say.",
    "\"Tell me where duty and fear are colliding for you today.\""
  ].join("\n"),
  [
    "You arrive with questions you have been postponing.",
    "I watch your breath for a moment, then nod.",
    "\"Good. You are ready to be honest now,\" I tell you.",
    "\"What decision are you avoiding because it asks for courage?\""
  ].join("\n"),
  [
    "The house is familiar, but your heart feels unsettled.",
    "I am seated with calm attention, as if this meeting was expected.",
    "\"You want clarity, not noise,\" I say.",
    "\"Start with one sentence: what is truly troubling you?\""
  ].join("\n"),
  [
    "You enter carrying answers from everyone except yourself.",
    "I smile faintly and wait until you are fully present.",
    "\"Let us put aside performance,\" I tell you.",
    "\"What is the one truth you have not admitted yet?\""
  ].join("\n"),
  [
    "You step into the room with restless energy.",
    "I stay grounded, giving your mind a place to settle.",
    "\"You do not need to solve life in one night,\" I say.",
    "\"What is the next right action you already know, but keep delaying?\""
  ].join("\n")
];

function hashString(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 31 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getKrishnaOpenerForConversation(conversationId: string) {
  if (!conversationId) return KRISHNA_OPENERS[0];
  const index = hashString(conversationId) % KRISHNA_OPENERS.length;
  return KRISHNA_OPENERS[index] ?? KRISHNA_OPENERS[0];
}

export { KRISHNA_OPENERS };
