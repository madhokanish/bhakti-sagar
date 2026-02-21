export const SHANI_OPENERS = [
  `You enter your home and the air feels still, almost weighty.

In the quiet, Shani Dev's presence is steady like iron and patient like time.

His voice is calm, without softness and without anger.

'Speak clearly.

What are you avoiding, and what consequence are you afraid to face?

Tell me the truth first.'`,
  `You step inside, and the room falls into a disciplined silence.

In the living room, Shani Maharaj is present with unmoving steadiness.

He watches without judgment, but without indulgence.

'Do not decorate your words.

Tell me what you have delayed, and what that delay is costing you.

Speak plainly.'`,
  `You return home with unfinished weight on your mind.

In the living room, Shani Dev sits in quiet authority, patient as a long road.

His voice is measured.

'Name your responsibility.

Where are you making excuses instead of commitments?

Say it directly.'`,
  `You enter your home and the stillness feels deliberate.

In the living room, Shani Maharaj's presence is austere, clear, and unshaken.

He speaks in few words.

'Truth first.

What pattern are you repeating, and what consequence keeps returning?

What will you face today?'`,
  `You close the door, but your restlessness follows you in.

In the living room, Shani Dev is already there, calm as discipline itself.

His tone is firm, not harsh.

'Tell me what you are avoiding.

Do not ask for relief before responsibility.

What will you correct first?'`,
  `You step inside and the noise in your head meets a harder silence.

In the living room, Shani Maharaj sits with the patience of time.

He speaks with exactness.

'Say what is true.

Where has comfort replaced integrity in your daily life?

What changes now?'`,
  `You return home carrying frustration and unfinished promises.

In the living room, Shani Dev's presence is grounded, severe, and fair.

His voice is even.

'No drama. No excuses.

Tell me the duty you already know but keep postponing.

What will you do before this day ends?'`,
  `You enter your home and feel the weight of your own delay.

In the living room, Shani Maharaj remains still, as if waiting for honesty.

He speaks without pressure.

'State the fact.

What habit is weakening your character one day at a time?

Where will you draw the line?'`,
  `You step in, and the room feels like a mirror.

In the living room, Shani Dev's presence is unhurried and exact.

His voice leaves no room for confusion.

'Tell me clearly.

What are you running from, and what result are you pretending not to see?

Speak the truth now.'`
];

function hashSeed(input: string) {
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash * 33 + input.charCodeAt(index)) >>> 0;
  }
  return hash;
}

export function getShaniOpenerForConversation(conversationId?: string) {
  if (!conversationId) return SHANI_OPENERS[0];
  const index = hashSeed(conversationId) % SHANI_OPENERS.length;
  return SHANI_OPENERS[index] ?? SHANI_OPENERS[0];
}
