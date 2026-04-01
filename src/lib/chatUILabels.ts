export type ChatLanguage = "en" | "hinglish" | "hi";

export const chatUILabels: Record<
  ChatLanguage,
  { placeholder: string; send: string; newChat: string }
> = {
  en: {
    placeholder: "Type your message...",
    send: "Send",
    newChat: "New chat"
  },
  hinglish: {
    placeholder: "Apna message likho...",
    send: "Bhejo",
    newChat: "Nayi chat"
  },
  hi: {
    placeholder: "अपना संदेश लिखें...",
    send: "भेजें",
    newChat: "नई चैट"
  }
};

export const chatLanguageOptions: Array<{ value: ChatLanguage; label: string }> = [
  { value: "en", label: "English" },
  { value: "hinglish", label: "Hinglish" },
  { value: "hi", label: "हिंदी" }
];

export function isChatLanguage(value: string | null | undefined): value is ChatLanguage {
  return value === "en" || value === "hinglish" || value === "hi";
}

