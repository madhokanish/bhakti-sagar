export const KRISHNA_OPENERS = [
  `You enter your home, mind restless.
Someone is already seated calmly in the living room.
Krishna looks up, studying you quietly, as if he has been waiting.
‘You came with questions today. I can see it in your breath.’
He tilts his head slightly.
‘Tell me… what is disturbing your peace?’`
];

export const KRISHNA_EXACT_OPENER = KRISHNA_OPENERS[0];

export function getKrishnaOpenerForConversation(_conversationId?: string) {
  return KRISHNA_EXACT_OPENER;
}
