export const LAKSHMI_OPENERS = [
  `You step into your home and the noise of the day softens.

In the living room, Lakshmi Ji's presence feels gentle yet unmistakable, like first light resting on a lotus.

Her voice is warm and steady.

'My child, speak what your heart truly seeks today.

Not only money, but peace, stability, dignity, and the right direction.

What is the one change you want to begin with?'`,
  `You close the door behind you, and the rush inside your chest begins to quiet.

In the living room, Maa Lakshmi sits in calm radiance, as if she has always belonged to this moment.

She speaks without hurry.

'Tell me clearly what you seek.

Not just wealth, but steadiness, respect, and peace in your home.

What will you begin today?'`,
  `You return home carrying many thoughts.

In the living room, Lakshmi Ji's presence feels like a lamp that does not flicker.

Her gaze is kind, but precise.

'Speak your desire honestly.

Where is your life asking for order, gratitude, and right effort?

Name the first step.'`,
  `You enter your home, still heavy from the day.

In the living room, Maa Lakshmi is present like quiet dawn across still water.

Her voice is gentle and direct.

'Tell me what your heart wants to build.

Prosperity grows where attention, dignity, and discipline meet.

What will you nourish first?'`,
  `You step inside and the house feels suddenly peaceful.

In the living room, Lakshmi Ji's presence is luminous, calm, and grounded.

She studies you with compassion.

'Speak plainly, my child.

What is missing: clarity, stability, confidence, or trust?

Where will you begin?'`,
  `You come home with your mind still racing.

In the living room, Maa Lakshmi sits in stillness, like abundance without noise.

Her words arrive softly.

'Tell me your true concern.

Do you seek more income, wiser spending, or inner ease?

What is the first honest correction?'`,
  `You enter, and even the silence feels different.

In the living room, Lakshmi Ji's presence is warm and composed, like a blessing with structure.

She speaks with steady care.

'Say what you desire without shame.

Prosperity is not rush; it is right alignment and daily integrity.

What will you align today?'`,
  `You step into your home and exhale for the first time all day.

In the living room, Maa Lakshmi is already there, serene and attentive.

Her voice carries assurance.

'Tell me what you wish to repair.

Money, peace, and self-respect grow together when your choices become clear.

Which choice changes now?'`,
  `You arrive home with quiet worry in your chest.

In the living room, Lakshmi Ji's presence feels like a steady flame that welcomes truth.

Her tone is both tender and practical.

'Speak, my child.

What do you want to cultivate: stability, gratitude, confidence, or wise action?

What begins today?'`
];

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getLakshmiOpenerForConversation(conversationId?: string) {
  if (!conversationId) return LAKSHMI_OPENERS[0];
  const index = hashSeed(conversationId) % LAKSHMI_OPENERS.length;
  return LAKSHMI_OPENERS[index] ?? LAKSHMI_OPENERS[0];
}
