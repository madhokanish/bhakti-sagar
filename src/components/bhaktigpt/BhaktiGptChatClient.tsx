"use client";

import { Fragment, useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";
import { Noto_Sans_Devanagari } from "next/font/google";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { trackEvent } from "@/lib/analytics";
import { useAuthModal } from "@/components/auth/AuthModalProvider";
import { getGuideConfig } from "@/lib/bhaktigpt/guideConfig";
import { chatOpeners } from "@/lib/chatOpeners";
import { HOME_LANG_COOKIE } from "@/lib/homeCopy";
import { setBhaktiLangPreference } from "@/lib/useBhaktiLang";
import {
  chatLanguageOptions,
  chatUILabels,
  isChatLanguage,
  type ChatLanguage
} from "@/lib/chatUILabels";
import {
  BHAKTI_GUIDE_LIST,
  BHAKTI_GUIDES,
  isGuideId,
  type BhaktiGuideId
} from "@/lib/bhaktigpt/guides";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt?: string;
};

type ConversationSummary = {
  id: string;
  guideId: BhaktiGuideId;
  title: string | null;
  updatedAt: string;
  createdAt: string;
  hasUserMessage: boolean;
};

type InitialResponse = {
  conversations: ConversationSummary[];
  messages: ChatMessage[];
  conversationId: string | null;
};

type StreamEventPayload = Record<string, unknown>;
type StreamEvent = {
  event: string;
  data: StreamEventPayload | null;
};

type LoadState = "loading" | "ready" | "error";
const SCROLL_BOTTOM_THRESHOLD = 120;

const CHAT_THEME_VARS = {
  "--bg": "#FFF8EF",
  "--surface": "#FFFDF9",
  "--surface-2": "#FFF2E0",
  "--text": "#2D1608",
  "--text-muted": "#7A5A45",
  "--border": "#EBC9A2",
  "--accent": "#2D1608",
  "--accent-contrast": "#FFFDF8",
  "--user-bubble": "#2D1608",
  "--assistant-bubble": "#FFFFFF",
  "--shadow": "0 1px 2px rgba(44,26,18,0.09), 0 14px 32px -24px rgba(44,26,18,0.5)"
} as CSSProperties;

const MOBILE_SUGGESTED_PROMPTS = [
  "chat_suggested_1",
  "chat_suggested_2",
  "chat_suggested_3"
];
const CHAT_LANGUAGE_STORAGE_KEY = "chat_lang";

const devanagariFont = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "500", "600", "700"]
});

type Translate = (key: string, values?: Record<string, string | number>) => string;

async function parseJsonSafe(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function generateLocalId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `msg_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
}

function formatMessageTime(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatConversationStartedAt(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function getConversationLabelLocalized(conversation: ConversationSummary, fallbackNewChat: string) {
  const title = conversation.title?.trim();
  if (title && title.toLowerCase() !== "new chat") return title;
  if (conversation.hasUserMessage) {
    return formatConversationStartedAt(conversation.createdAt) ?? fallbackNewChat;
  }
  return fallbackNewChat;
}

function getLocalizedGuideContent(guideId: BhaktiGuideId, t: Translate) {
  if (guideId === "krishna") {
    return {
      name: t("chat_guide_krishna_name"),
      subtitle: t("chat_guide_krishna_subtitle"),
      shortDescription: t("chat_guide_krishna_short"),
      aboutIntro: t("chat_guide_krishna_about_intro"),
      canHelpWith: [
        t("chat_guide_krishna_can_1"),
        t("chat_guide_krishna_can_2"),
        t("chat_guide_krishna_can_3")
      ],
      cannotHelpWith: [
        t("chat_guide_krishna_cannot_1"),
        t("chat_guide_krishna_cannot_2"),
        t("chat_guide_krishna_cannot_3")
      ]
    };
  }

  if (guideId === "lakshmi") {
    return {
      name: t("chat_guide_lakshmi_name"),
      subtitle: t("chat_guide_lakshmi_subtitle"),
      shortDescription: t("chat_guide_lakshmi_short"),
      aboutIntro: t("chat_guide_lakshmi_about_intro"),
      canHelpWith: [
        t("chat_guide_lakshmi_can_1"),
        t("chat_guide_lakshmi_can_2"),
        t("chat_guide_lakshmi_can_3")
      ],
      cannotHelpWith: [
        t("chat_guide_lakshmi_cannot_1"),
        t("chat_guide_lakshmi_cannot_2"),
        t("chat_guide_lakshmi_cannot_3")
      ]
    };
  }

  if (guideId === "shiv") {
    return {
      name: t("chat_guide_shiv_name"),
      subtitle: t("chat_guide_shiv_subtitle"),
      shortDescription: t("chat_guide_shiv_short"),
      aboutIntro: t("chat_guide_shiv_about_intro"),
      canHelpWith: [
        t("chat_guide_shiv_can_1"),
        t("chat_guide_shiv_can_2"),
        t("chat_guide_shiv_can_3")
      ],
      cannotHelpWith: [
        t("chat_guide_shiv_cannot_1"),
        t("chat_guide_shiv_cannot_2"),
        t("chat_guide_shiv_cannot_3")
      ]
    };
  }

  if (guideId === "hanuman") {
    return {
      name: t("chat_guide_hanuman_name"),
      subtitle: t("chat_guide_hanuman_subtitle"),
      shortDescription: t("chat_guide_hanuman_short"),
      aboutIntro: t("chat_guide_hanuman_about_intro"),
      canHelpWith: [
        t("chat_guide_hanuman_can_1"),
        t("chat_guide_hanuman_can_2"),
        t("chat_guide_hanuman_can_3")
      ],
      cannotHelpWith: [
        t("chat_guide_hanuman_cannot_1"),
        t("chat_guide_hanuman_cannot_2"),
        t("chat_guide_hanuman_cannot_3")
      ]
    };
  }

  return {
    name: t("chat_guide_shani_name"),
    subtitle: t("chat_guide_shani_subtitle"),
    shortDescription: t("chat_guide_shani_short"),
    aboutIntro: t("chat_guide_shani_about_intro"),
    canHelpWith: [
      t("chat_guide_shani_can_1"),
      t("chat_guide_shani_can_2"),
      t("chat_guide_shani_can_3")
    ],
    cannotHelpWith: [
      t("chat_guide_shani_cannot_1"),
      t("chat_guide_shani_cannot_2"),
      t("chat_guide_shani_cannot_3")
    ]
  };
}

function splitLinkSuffix(rawUrl: string) {
  const match = rawUrl.match(/[),.!?;:]+$/);
  if (!match) {
    return { href: rawUrl, suffix: "" };
  }
  const suffix = match[0];
  return {
    href: rawUrl.slice(0, -suffix.length),
    suffix
  };
}

function renderLineWithLinks(line: string, keyPrefix: string) {
  const urlPattern = /(https?:\/\/[^\s]+)/g;
  const parts = line.split(urlPattern);
  return parts.map((part, index) => {
    if (!/^https?:\/\//.test(part)) {
      return <Fragment key={`${keyPrefix}-text-${index}`}>{part}</Fragment>;
    }

    const { href, suffix } = splitLinkSuffix(part);
    return (
      <Fragment key={`${keyPrefix}-link-${index}`}>
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="break-all text-inherit underline underline-offset-2 transition-colors duration-200 motion-reduce:transition-none hover:text-[color:var(--text-muted)]"
        >
          {href}
        </a>
        {suffix}
      </Fragment>
    );
  });
}

function renderMessageContent(content: string, options?: { autoParagraph?: boolean }) {
  const normalized = content.replace(/\r\n/g, "\n").trim();
  if (!normalized) return null;

  let formatted = normalized;
  if (options?.autoParagraph && !formatted.includes("\n")) {
    const sentenceParts = formatted
      .split(/(?<=[.!?])\s+(?=[A-Z0-9"'])/)
      .map((part) => part.trim())
      .filter(Boolean);
    if (sentenceParts.length >= 2) {
      formatted = sentenceParts.join("\n\n");
    }
  }

  const paragraphs = formatted
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <div className="space-y-3 break-words whitespace-pre-line text-inherit [overflow-wrap:anywhere] [word-break:break-word] [&_a]:break-all [&_code]:rounded-[8px] [&_code]:bg-[color:var(--surface-2)] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.9em] [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_pre]:rounded-[12px] [&_pre]:bg-[#111827] [&_pre]:p-3 [&_pre]:text-[13px] [&_pre]:leading-6 [&_pre]:text-slate-100 [&_pre_code]:bg-transparent [&_pre_code]:p-0">
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split("\n");

        return (
          <p key={`${paragraphIndex}-${paragraph.slice(0, 16)}`} className="leading-[1.6] text-inherit">
            {lines.map((line, lineIndex) => (
              <Fragment key={`${lineIndex}-${line.slice(0, 12)}`}>
                {renderLineWithLinks(line, `${paragraphIndex}-${lineIndex}`)}
                {lineIndex < lines.length - 1 ? <br /> : null}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}

function GuideAvatar({
  guideId,
  size = "md",
  className = ""
}: {
  guideId: BhaktiGuideId;
  size?: "sm" | "md";
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  const config = getGuideConfig(guideId);
  const initial = config.displayName.charAt(0).toUpperCase();
  const sizeClass = size === "sm" ? "h-8 w-8" : "h-10 w-10";

  if (failed) {
    return (
      <span
        className={`inline-flex ${sizeClass} items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] text-xs font-semibold text-[color:var(--text-muted)] ${className}`}
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block ${sizeClass} overflow-hidden rounded-full border border-[color:var(--border)] shadow-[var(--shadow)] ${className}`}
    >
      <Image
        src={config.avatarPath}
        alt={`${config.displayName} avatar`}
        fill
        sizes={size === "sm" ? "32px" : "40px"}
        className="object-cover"
        style={{ objectPosition: config.avatarObjectPosition ?? "50% 20%" }}
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function parseSseBlock(block: string): StreamEvent | null {
  const lines = block.split("\n").filter(Boolean);
  if (lines.length === 0) return null;

  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith("event:")) {
      eventName = line.slice(6).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataLines.push(line.slice(5).trim());
    }
  }

  if (dataLines.length === 0) return null;

  const dataText = dataLines.join("\n");
  try {
    return {
      event: eventName,
      data: JSON.parse(dataText) as StreamEventPayload
    };
  } catch {
    return {
      event: eventName,
      data: { value: dataText }
    };
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return null;
  const token = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!token) return null;
  return decodeURIComponent(token.split("=")[1] ?? "");
}

async function consumeSseStream(response: Response, onEvent: (event: StreamEvent) => void) {
  if (!response.body) {
    throw new Error("Stream body is not available.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const block = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");

      const parsed = parseSseBlock(block);
      if (parsed) onEvent(parsed);
    }
  }

  if (buffer.trim()) {
    const parsed = parseSseBlock(buffer);
    if (parsed) onEvent(parsed);
  }
}

function GuidePicker({
  onPick,
  title,
  subtitle,
  description,
  guides
}: {
  onPick: (guideId: BhaktiGuideId) => void;
  title: string;
  subtitle: string;
  description?: string;
  guides: Array<{
    id: BhaktiGuideId;
    name: string;
    subtitle: string;
    shortDescription: string;
    imageSrc: string;
    imageAlt: string;
  }>;
}) {
  return (
    <section
      style={CHAT_THEME_VARS}
      className="space-y-4 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 text-[color:var(--text)] shadow-[var(--shadow)] font-sans"
    >
      <header>
        <h1 className="font-sans text-2xl font-semibold text-[color:var(--text)]">{title}</h1>
        <p className="mt-2 text-sm text-[color:var(--text-muted)]">{subtitle}</p>
        {description ? <p className="mt-2 text-sm text-[color:var(--text-muted)]">{description}</p> : null}
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {guides.map((guide) => (
          <button
            key={guide.id}
            type="button"
            onClick={() => onPick(guide.id)}
            className="overflow-hidden rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] text-left shadow-[var(--shadow)] transition-transform transition-colors duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:bg-[color:var(--surface-2)] hover:border-[color:var(--text-muted)]"
          >
            <div className="relative aspect-[4/5] min-h-[320px] bg-[color:var(--surface-2)] md:min-h-[360px]">
              <Image
                src={guide.imageSrc}
                alt={guide.imageAlt}
                fill
                className="object-contain object-center p-3"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-sm font-semibold">{guide.name}</p>
                <p className="text-xs text-white/90">{guide.subtitle}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-[color:var(--text-muted)]">{guide.shortDescription}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function BhaktiGptChatClient() {
  const t = useTranslations();
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsKey = searchParams.toString();
  const { openAuthModal } = useAuthModal();

  const guideParam = searchParams.get("guide");
  const langParam = searchParams.get("lang");
  const chatLangParam = searchParams.get("chatLang");
  const prefillParam = searchParams.get("prefill");
  const initialQueryChatLanguage = isChatLanguage(langParam)
    ? langParam
    : isChatLanguage(chatLangParam)
      ? chatLangParam
      : null;
  const selectedGuideId = isGuideId(guideParam ?? "") ? (guideParam as BhaktiGuideId) : null;
  const selectedGuide = selectedGuideId ? BHAKTI_GUIDES[selectedGuideId] : null;
  const selectedGuideConfig = selectedGuideId ? getGuideConfig(selectedGuideId) : null;
  const localizedGuideContent = Object.fromEntries(
    BHAKTI_GUIDE_LIST.map((guide) => [guide.id, getLocalizedGuideContent(guide.id, t as Translate)])
  ) as Record<BhaktiGuideId, ReturnType<typeof getLocalizedGuideContent>>;
  const selectedGuideLocalized = selectedGuideId ? localizedGuideContent[selectedGuideId] : null;
  const localizedGuideCards = BHAKTI_GUIDE_LIST.map((guide) => ({
    id: guide.id,
    name: localizedGuideContent[guide.id].name,
    subtitle: localizedGuideContent[guide.id].subtitle,
    shortDescription: localizedGuideContent[guide.id].shortDescription,
    imageSrc: guide.imageSrc,
    imageAlt: guide.imageAlt
  }));
  const chatPath = "/chat";
  const [chatLanguage, setChatLanguage] = useState<ChatLanguage>(initialQueryChatLanguage ?? "en");
  const uiLabels = chatUILabels[chatLanguage];
  const sendingLabel =
    chatLanguage === "hi" ? "भेज रहे हैं..." : chatLanguage === "hinglish" ? "Bhej rahe..." : "Sending...";

  const signInCallbackUrl = (() => {
    const params = new URLSearchParams(searchParamsKey);
    params.delete("auth");
    params.delete("callbackUrl");
    const query = params.toString();
    return query ? `${chatPath}?${query}` : chatPath;
  })();

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showSignInPrompt, setShowSignInPrompt] = useState(false);
  const [isGuideSwitching, setIsGuideSwitching] = useState(false);
  const [showScrollToLatest, setShowScrollToLatest] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const headerShellRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const composerShellRef = useRef<HTMLDivElement | null>(null);
  const handledPrefillRef = useRef<string | null>(null);
  const guideSnapshotRef = useRef<Partial<Record<BhaktiGuideId, InitialResponse>>>({});
  const loadStateRef = useRef<LoadState>("loading");
  const shouldAutoScrollRef = useRef(true);
  const [headerHeight, setHeaderHeight] = useState(84);
  const [composerHeight, setComposerHeight] = useState(124);

  const suggestedPrompts = MOBILE_SUGGESTED_PROMPTS.map((key) => t(key));
  const chatDisclaimer = t("chat_disclaimer");
  const chatDisclaimerLong = t("chat_disclaimer_long");

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const isNearBottom = useCallback((threshold = SCROLL_BOTTOM_THRESHOLD) => {
    const container = messagesRef.current;
    if (!container) return true;
    const delta = container.scrollHeight - container.scrollTop - container.clientHeight;
    return delta <= threshold;
  }, []);

  useEffect(() => {
    loadStateRef.current = loadState;
  }, [loadState]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (initialQueryChatLanguage) {
      setChatLanguage(initialQueryChatLanguage);
      setBhaktiLangPreference(initialQueryChatLanguage);
      return;
    }
    const cookieLang = readCookie(HOME_LANG_COOKIE);
    const preferredFromCookie = isChatLanguage(cookieLang) ? cookieLang : null;
    try {
      const stored = window.localStorage.getItem(CHAT_LANGUAGE_STORAGE_KEY);
      if (isChatLanguage(stored)) {
        setChatLanguage(stored);
      } else if (preferredFromCookie) {
        setChatLanguage(preferredFromCookie);
      }
    } catch {
      // ignore storage errors
      if (preferredFromCookie) {
        setChatLanguage(preferredFromCookie);
      }
    }
  }, [initialQueryChatLanguage]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setBhaktiLangPreference(chatLanguage);
  }, [chatLanguage]);

  const updateLanguageQuery = useCallback(
    (nextLanguage: ChatLanguage) => {
      const params = new URLSearchParams(searchParamsKey);
      params.delete("chatLang");
      if (nextLanguage === "en") {
        params.delete("lang");
      } else {
        params.set("lang", nextLanguage);
      }
      const query = params.toString();
      router.replace(query ? `${chatPath}?${query}` : chatPath, { scroll: false });
    },
    [chatPath, router, searchParamsKey]
  );

  const handleChatLanguageChange = useCallback(
    (nextLanguage: ChatLanguage) => {
      if (nextLanguage === chatLanguage) return;
      setChatLanguage(nextLanguage);
      updateLanguageQuery(nextLanguage);
    },
    [chatLanguage, updateLanguageQuery]
  );

  useEffect(() => {
    if (!selectedGuideId || loadState !== "ready") return;
    const openerText = chatOpeners[selectedGuideId][chatLanguage];

    setMessages((prev) => {
      if (prev.length !== 1 || prev[0]?.role !== "assistant") return prev;
      if (prev[0].content === openerText) return prev;
      return [{ ...prev[0], content: openerText }];
    });

    const cached = guideSnapshotRef.current[selectedGuideId];
    if (!cached || cached.messages.length !== 1 || cached.messages[0]?.role !== "assistant") return;
    if (cached.messages[0].content === openerText) return;
    guideSnapshotRef.current[selectedGuideId] = {
      ...cached,
      messages: [{ ...cached.messages[0], content: openerText }]
    };
  }, [chatLanguage, loadState, selectedGuideId]);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto", force = false) => {
    const container = messagesRef.current;
    if (!container) return;
    if (!force && !shouldAutoScrollRef.current) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    });
    shouldAutoScrollRef.current = true;
    setShowScrollToLatest(false);
  }, []);

  const syncComposerHeight = useCallback(() => {
    const textarea = composerRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    const lineHeight = 24;
    const maxHeight = lineHeight * 4 + 16;
    const nextHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${Math.max(nextHeight, lineHeight + 16)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, []);

  const updateGuideQuery = useCallback(
    (
      guideId: BhaktiGuideId,
      keepConversationId?: string | null,
      options?: { forceNewConversation?: boolean }
    ) => {
      const params = new URLSearchParams(searchParamsKey);
      params.set("guide", guideId);
      if (keepConversationId) {
        params.set("conversationId", keepConversationId);
        params.delete("new");
      } else if (options?.forceNewConversation) {
        params.set("new", "1");
      } else {
        params.delete("conversationId");
        params.delete("new");
      }
      router.replace(`${chatPath}?${params.toString()}`);
    },
    [chatPath, router, searchParamsKey]
  );

  const loadGuideConversation = useCallback(async (
    guideId: BhaktiGuideId,
    preferredConversationId?: string | null,
    forceNewConversation = false
  ) => {
    const cached = guideSnapshotRef.current[guideId];
    const canUseCache =
      Boolean(cached) &&
      !forceNewConversation &&
      (!preferredConversationId || preferredConversationId === cached?.conversationId);

    if (canUseCache && cached) {
      setConversations(cached.conversations || []);
      setMessages(cached.messages || []);
      setConversationId(cached.conversationId || null);
      setLoadState("ready");
      setIsGuideSwitching(false);
      return;
    } else if (loadStateRef.current === "ready") {
      setIsGuideSwitching(true);
    } else {
      setLoadState("loading");
      setConversations([]);
      setMessages([]);
      setConversationId(null);
    }
    setLoadError(null);
    setComposerError(null);

    try {
      const conversationQuery = preferredConversationId ? `&conversationId=${preferredConversationId}` : "";
      const newQuery = forceNewConversation ? "&new=1" : "";
      const response = await fetch(
        `/api/bhaktigpt/chat?guideId=${guideId}${conversationQuery}${newQuery}&chatLang=${chatLanguage}`,
        {
        method: "GET",
        cache: "no-store"
        }
      );
      const raw = await parseJsonSafe(response);
      if (!response.ok) {
        const errorMessage =
          (raw && typeof raw.error === "string" && raw.error) ||
          t("chat_error_load");
        throw new Error(errorMessage);
      }
      if (!raw) throw new Error(t("chat_error_load"));

      const data = raw as unknown as InitialResponse;
      const nextConversationId = data.conversationId || null;
      setConversations(data.conversations || []);
      setMessages(data.messages || []);
      setConversationId(nextConversationId);
      guideSnapshotRef.current[guideId] = {
        conversations: data.conversations || [],
        messages: data.messages || [],
        conversationId: nextConversationId
      };
      if (nextConversationId) {
        updateGuideQuery(guideId, nextConversationId);
      } else if (forceNewConversation) {
        updateGuideQuery(guideId, null, { forceNewConversation: true });
      }
      setLoadState("ready");
      setIsGuideSwitching(false);
      focusComposer();
    } catch (error) {
      if (loadStateRef.current === "ready") {
        setComposerError(error instanceof Error ? error.message : t("chat_error_load"));
      } else {
        setLoadState("error");
        setLoadError(error instanceof Error ? error.message : t("chat_error_load"));
      }
      setIsGuideSwitching(false);
    }
  }, [chatLanguage, focusComposer, updateGuideQuery, t]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previousHtmlOverflow = html.style.overflow;
    const previousHtmlOverscroll = html.style.overscrollBehavior;
    const previousBodyOverflow = body.style.overflow;
    const previousBodyOverscroll = body.style.overscrollBehavior;

    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";
    body.style.overflow = "hidden";
    body.style.overscrollBehavior = "none";

    return () => {
      html.style.overflow = previousHtmlOverflow;
      html.style.overscrollBehavior = previousHtmlOverscroll;
      body.style.overflow = previousBodyOverflow;
      body.style.overscrollBehavior = previousBodyOverscroll;
    };
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setPrefersReducedMotion(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const syncOnlineStatus = () => setIsOffline(!navigator.onLine);
    syncOnlineStatus();
    window.addEventListener("online", syncOnlineStatus);
    window.addEventListener("offline", syncOnlineStatus);
    return () => {
      window.removeEventListener("online", syncOnlineStatus);
      window.removeEventListener("offline", syncOnlineStatus);
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const updateChatViewportHeight = () => {
      const viewportHeight = window.innerHeight;
      root.style.setProperty("--chat-vh", `${Math.round(viewportHeight)}px`);
    };
    updateChatViewportHeight();
    window.addEventListener("resize", updateChatViewportHeight);
    window.addEventListener("orientationchange", updateChatViewportHeight);
    return () => {
      root.style.removeProperty("--chat-vh");
      window.removeEventListener("resize", updateChatViewportHeight);
      window.removeEventListener("orientationchange", updateChatViewportHeight);
    };
  }, []);

  useEffect(() => {
    if (!selectedGuideId) {
      setLoadState("ready");
      setMessages([]);
      setConversationId(null);
      setConversations([]);
      return;
    }

    const params = new URLSearchParams(searchParamsKey);
    const preferredConversationId = params.get("conversationId");
    const forceNewConversation = params.get("new") === "1";
    void loadGuideConversation(selectedGuideId, preferredConversationId, forceNewConversation);
  }, [selectedGuideId, loadGuideConversation, searchParamsKey]);

  useEffect(() => {
    if (!selectedGuideId || !prefillParam) return;

    const prefillKey = `${selectedGuideId}:${prefillParam}`;
    if (handledPrefillRef.current === prefillKey) return;

    handledPrefillRef.current = prefillKey;
    setInputValue((current) => (current.trim().length ? current : prefillParam));
    requestAnimationFrame(() => composerRef.current?.focus());

    const params = new URLSearchParams(searchParamsKey);
    params.delete("prefill");
    router.replace(`${chatPath}?${params.toString()}`);
  }, [chatPath, prefillParam, router, searchParamsKey, selectedGuideId]);

  useEffect(() => {
    if (loadState !== "ready") return;
    if (!shouldAutoScrollRef.current) {
      setShowScrollToLatest(true);
      return;
    }
    const behavior = isStreaming || prefersReducedMotion ? "auto" : "smooth";
    scrollMessagesToBottom(behavior, true);
  }, [isStreaming, loadState, messages, prefersReducedMotion, scrollMessagesToBottom]);

  useEffect(() => {
    if (selectedGuideId && loadState === "ready") {
      focusComposer();
      syncComposerHeight();
    }
  }, [focusComposer, loadState, selectedGuideId, syncComposerHeight]);

  useEffect(() => {
    syncComposerHeight();
  }, [inputValue, syncComposerHeight]);

  useEffect(() => {
    const header = headerShellRef.current;
    if (!header) return;

    const updateHeight = () => {
      setHeaderHeight(header.offsetHeight);
    };
    updateHeight();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(header);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    const shell = composerShellRef.current;
    if (!shell) return;

    const updateHeight = () => {
      setComposerHeight(shell.offsetHeight);
    };
    updateHeight();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(updateHeight);
      observer.observe(shell);
      return () => observer.disconnect();
    }

    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    const onScroll = () => {
      const nearBottom = isNearBottom();
      shouldAutoScrollRef.current = nearBottom;
      setShowScrollToLatest(!nearBottom);
    };
    onScroll();
    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [isNearBottom]);

  const openConversation = useCallback(
    async (id: string) => {
      if (!selectedGuideId) return;
      shouldAutoScrollRef.current = true;
      setShowScrollToLatest(false);
      setConversationId(id);
      updateGuideQuery(selectedGuideId, id);
      await loadGuideConversation(selectedGuideId, id);
    },
    [loadGuideConversation, selectedGuideId, updateGuideQuery]
  );

  const startNewChat = useCallback(() => {
    if (!selectedGuideId) return;
    shouldAutoScrollRef.current = true;
    setShowScrollToLatest(false);
    setConversationId(null);
    setMessages([]);
    setComposerError(null);
    if (selectedGuideId === "krishna") {
      void loadGuideConversation(selectedGuideId, null, true);
    } else {
      updateGuideQuery(selectedGuideId, null, { forceNewConversation: true });
      setLoadState("ready");
    }
    focusComposer();
  }, [focusComposer, loadGuideConversation, selectedGuideId, updateGuideQuery]);

  const handleBack = useCallback(() => {
    if (chatLanguage === "hi") {
      router.push("/hi");
      return;
    }
    if (chatLanguage === "hinglish") {
      router.push("/?lang=hinglish");
      return;
    }
    router.push("/");
  }, [chatLanguage, router]);

  const sendMessage = useCallback(
    async (prefilled?: string) => {
      if (!selectedGuideId) return;

      const value = (prefilled ?? inputValue).trim();
      if (!value || isStreaming) return;
      shouldAutoScrollRef.current = true;
      setShowScrollToLatest(false);

      const userMessageId = generateLocalId();
      const assistantMessageId = generateLocalId();
      const userMessage: ChatMessage = {
        id: userMessageId,
        role: "user",
        content: value,
        createdAt: new Date().toISOString()
      };
      const assistantPlaceholder: ChatMessage = {
        id: assistantMessageId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      };

      setComposerError(null);
      setLastFailedMessage(null);
      setIsStreaming(true);
      setMessages((prev) => [...prev, userMessage, assistantPlaceholder]);
      setInputValue("");
      focusComposer();

      let streamedText = "";

      try {
        const response = await fetch("/api/bhaktigpt/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream"
          },
          body: JSON.stringify({
            guideId: selectedGuideId,
            conversationId,
            forceNewConversation: conversationId === null && messages.length === 0,
            chatLang: chatLanguage,
            message: value
          })
        });

        if (!response.ok) {
          const raw = await parseJsonSafe(response);
          const message =
            (raw && typeof raw.error === "string" && raw.error) || t("chat_error_send");
          throw new Error(message);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/event-stream")) {
          const raw = await parseJsonSafe(response);
          if (!raw) throw new Error(t("chat_error_invalid_response"));
          if (raw.limitReached === true) {
            setShowSignInPrompt(true);
            setMessages((prev) => prev.filter((item) => item.id !== assistantMessageId));
            return;
          }

          const assistantMessage =
            typeof raw.assistantMessage === "string" ? raw.assistantMessage : "";
          streamedText = assistantMessage;
          setMessages((prev) =>
            prev.map((item) =>
              item.id === assistantMessageId ? { ...item, content: assistantMessage } : item
            )
          );
          if (typeof raw.conversationId === "string") {
            setConversationId(raw.conversationId);
            updateGuideQuery(selectedGuideId, raw.conversationId);
          }
          return;
        }

        await consumeSseStream(response, (event) => {
          const data = event.data || {};

          if (event.event === "meta" || event.event === "done") {
            if (typeof data.conversationId === "string") {
              setConversationId(data.conversationId);
              updateGuideQuery(selectedGuideId, data.conversationId);
            }
            return;
          }

          if (event.event === "token") {
            const chunk = typeof data.text === "string" ? data.text : "";
            if (!chunk) return;
            streamedText += chunk;
            setMessages((prev) =>
              prev.map((item) =>
                item.id === assistantMessageId ? { ...item, content: streamedText } : item
              )
            );
            return;
          }

          if (event.event === "error") {
            const message =
              typeof data.message === "string"
                ? data.message
                : t("chat_error_process");
            throw new Error(message);
          }
        });

        if (!streamedText.trim()) {
          const fallback = t("chat_fallback_empty_response");
          setMessages((prev) =>
            prev.map((item) => (item.id === assistantMessageId ? { ...item, content: fallback } : item))
          );
        }

        trackEvent("sent_message", { guideId: selectedGuideId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : t("chat_error_process");
        setComposerError(errorMessage);
        setLastFailedMessage(value);
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: t("chat_error_retry_send") }
              : item
          )
        );
      } finally {
        setIsStreaming(false);
        focusComposer();
      }
    },
    [
      conversationId,
      focusComposer,
      inputValue,
      isStreaming,
      messages.length,
      chatLanguage,
      selectedGuideId,
      updateGuideQuery,
      t
    ]
  );

  if (!selectedGuideId || !selectedGuide) {
    return (
      <GuidePicker
        title={t("chat_choose_guide_title")}
        subtitle={t("chat_choose_guide_text")}
        description={chatDisclaimer}
        guides={localizedGuideCards}
        onPick={(guideId) => {
          trackEvent("selected_guide", { guideId, source: "guide_picker" });
          updateGuideQuery(guideId);
        }}
      />
    );
  }

  return (
    <div
      style={CHAT_THEME_VARS}
      className={`h-full min-h-0 font-sans ${
        chatLanguage === "hi" ? devanagariFont.className : ""
      }`}
    >
      <section className="grid h-full min-h-0 min-w-0 overflow-hidden rounded-none bg-[color:var(--bg)] text-[color:var(--text)] md:grid-cols-[18rem_1fr] md:rounded-[18px] md:border md:border-[color:var(--border)] md:bg-[color:var(--surface)] md:shadow-[var(--shadow)]">
        <aside className="hidden border-r border-[color:var(--border)] bg-[linear-gradient(180deg,var(--surface-2),rgba(255,246,231,0.72))] p-3 md:flex md:flex-col">
          <h2 className="px-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[color:var(--text-muted)]">{t("brand_name")}</h2>
          <button
            type="button"
            onClick={startNewChat}
            className="mt-3 min-h-11 rounded-[12px] bg-[color:var(--accent)] px-3 py-2 text-sm font-semibold text-[color:var(--accent-contrast)] transition-opacity duration-200 motion-reduce:transition-none hover:opacity-90 active:opacity-80"
          >
            {uiLabels.newChat}
          </button>

          <div className="mt-4 space-y-2">
            {BHAKTI_GUIDE_LIST.map((guide) => {
              const active = guide.id === selectedGuideId;
              return (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => {
                    if (guide.id === selectedGuideId) return;
                    trackEvent("selected_guide", { guideId: guide.id, source: "sidebar" });
                    updateGuideQuery(guide.id);
                  }}
                  className={`w-full rounded-[12px] border px-2.5 py-2 text-left transition-colors duration-200 motion-reduce:transition-none ${
                    active
                      ? "border-[color:var(--text-muted)] bg-[color:var(--surface)] shadow-[var(--shadow)]"
                      : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-muted)] hover:bg-[color:var(--surface-2)]"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <GuideAvatar guideId={guide.id} size="sm" className="rounded-lg" />
                    <span>
                      <span className="block text-sm font-semibold text-[color:var(--text)]">{localizedGuideContent[guide.id].name}</span>
                      <span className="block text-xs text-[color:var(--text-muted)]">{localizedGuideContent[guide.id].subtitle}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-[color:var(--border)] pt-3">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[color:var(--text-muted)]">{t("chat_recent")}</p>
            <div className="mt-2 space-y-1">
              {conversations.length === 0 ? (
                <p className="px-2 text-xs text-[color:var(--text-muted)]">{t("chat_no_threads")}</p>
              ) : (
                conversations.slice(0, 10).map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    className={`w-full rounded-[12px] border px-2 py-1.5 text-left text-xs transition-colors duration-200 motion-reduce:transition-none ${
                      conversation.id === conversationId
                        ? "border-[color:var(--text-muted)] bg-[color:var(--surface)] shadow-[0_8px_20px_-20px_rgba(44,26,18,0.9)]"
                        : "border-[color:var(--border)] bg-[color:var(--surface)] hover:border-[color:var(--text-muted)]"
                    }`}
                  >
                    {getConversationLabelLocalized(conversation, uiLabels.newChat)}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="relative flex min-h-0 min-w-0 flex-col overflow-hidden">
          <header
            ref={headerShellRef}
            className="absolute inset-x-0 top-0 z-20 border-b border-[color:var(--border)] bg-[color:var(--surface)]/95 px-3 pb-2 pt-[calc(env(safe-area-inset-top)+8px)] shadow-[0_8px_28px_-26px_rgba(0,0,0,0.65)] backdrop-blur sm:px-5"
          >
            <div className="grid grid-cols-[auto,1fr,auto] items-center gap-3">
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-11 items-center justify-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 text-[color:var(--text)] shadow-[0_10px_20px_-20px_rgba(44,26,18,0.9)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)]"
                  aria-label={t("chat_back")}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none">
                    <path d="M12.5 4.5 7 10l5.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className="hidden text-xs font-semibold sm:inline">{t("chat_back")}</span>
                </button>
              </div>

              <div className="flex min-w-0 items-center justify-center gap-2">
                <GuideAvatar guideId={selectedGuideId} size="sm" />
                <div className="min-w-0">
                  <p className="text-[13px] font-semibold leading-tight text-[color:var(--text)] [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden sm:truncate sm:text-sm">
                    {selectedGuideLocalized?.name ?? selectedGuideConfig?.displayName}
                  </p>
                  <p className="truncate text-[10px] text-[color:var(--text-muted)] sm:text-[11px]">
                    {t("brand_name")} • {t("chat_online_guide")}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <div className="inline-flex min-h-11 items-center gap-1 rounded-full border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1 shadow-[0_10px_22px_-22px_rgba(44,26,18,0.85)]">
                  {chatLanguageOptions.map((option) => {
                    const active = chatLanguage === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleChatLanguageChange(option.value)}
                        className={`rounded-full px-3 py-1.5 text-[11px] font-semibold transition-colors duration-150 motion-reduce:transition-none ${
                          active
                            ? "bg-[color:var(--surface)] text-[color:var(--text)] shadow-[0_8px_16px_-12px_rgba(44,26,18,0.8)]"
                            : "text-[color:var(--text-muted)] hover:text-[color:var(--text)]"
                        }`}
                        aria-pressed={active}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="hidden h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] shadow-[0_10px_20px_-20px_rgba(44,26,18,0.9)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)] sm:inline-flex"
                  aria-label={t("chat_about")}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none">
                    <circle cx="10" cy="10" r="7.25" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 8.2v4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    <circle cx="10" cy="5.9" r="0.9" fill="currentColor" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={startNewChat}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] text-[color:var(--text)] shadow-[0_10px_20px_-20px_rgba(44,26,18,0.9)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)]"
                  aria-label={uiLabels.newChat}
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" aria-hidden="true" fill="none">
                    <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </header>

          {isGuideSwitching ? (
            <div
              className="absolute inset-x-0 z-[19] border-b border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-1.5 text-xs text-[color:var(--text-muted)] sm:px-5"
              style={{ top: `${headerHeight}px` }}
            >
              <span className="inline-flex items-center gap-2">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[color:var(--text-muted)]" />
                {t("chat_switching_guide")}
              </span>
            </div>
          ) : null}

          <div
            ref={messagesRef}
            className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden bg-[color:var(--bg)] px-3 py-3 text-[16px] leading-[1.6] [overflow-wrap:anywhere] [word-break:break-word] [overscroll-behavior-y:contain] sm:px-5 sm:py-4 md:text-[15px] lg:text-[16px]"
            style={{
              paddingTop: `${headerHeight + (isGuideSwitching ? 34 : 10)}px`,
              paddingBottom: `${composerHeight + 28}px`
            }}
          >
            {isOffline ? (
              <div className="rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-xs text-[color:var(--text-muted)]">
                {t("chat_offline_notice")}
              </div>
            ) : null}

            {loadState === "loading" ? (
              <div className="space-y-3 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow)]">
                <p className="text-sm font-medium text-[color:var(--text-muted)]">{t("chat_loading_thread")}</p>
                <div className="h-16 w-2/3 animate-pulse rounded-[16px] bg-[color:var(--surface-2)]" />
                <div className="ml-auto h-14 w-1/2 animate-pulse rounded-[16px] bg-[color:var(--surface-2)]" />
                <div className="h-16 w-3/5 animate-pulse rounded-[16px] bg-[color:var(--surface-2)]" />
              </div>
            ) : null}

            {loadState === "error" ? (
              <div className="rounded-[14px] border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadGuideConversation(selectedGuideId)}
                  className="mt-3 min-h-11 rounded-[12px] border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition-colors duration-200 motion-reduce:transition-none hover:bg-rose-100"
                >
                  {t("chat_retry")}
                </button>
              </div>
            ) : null}

            {loadState === "ready" && messages.length === 0 ? (
              <div className="space-y-4 rounded-[16px] border border-[color:var(--border)] bg-[color:var(--surface)] p-4 shadow-[var(--shadow)] sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-[color:var(--text)]">
                    {t("chat_start_with", { name: selectedGuideLocalized?.name ?? selectedGuide.name })}
                  </p>
                  <p className="mt-1 text-sm text-[color:var(--text-muted)]">{selectedGuideLocalized?.shortDescription ?? selectedGuide.shortDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestedPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      disabled={isStreaming}
                      className="min-h-11 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-3 py-2 text-left text-xs text-[color:var(--text)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-[color:var(--text-muted)]">{chatDisclaimerLong}</p>
              </div>
            ) : null}

            {loadState === "ready"
              ? messages.map((message) => {
                  const isAssistantTyping =
                    message.role === "assistant" && isStreaming && message.content.trim().length === 0;

                  if (message.role === "assistant") {
                    return (
                      <div key={message.id} className="flex w-full max-w-[92%] min-w-0 items-start gap-3 md:max-w-[720px] md:gap-4">
                        <GuideAvatar guideId={selectedGuideId} size="sm" className="mt-0.5 shrink-0 md:h-10 md:w-10" />
                        <div className="w-full">
                          <article className="w-full min-w-0 rounded-[18px] border border-[color:var(--border)] bg-[color:var(--assistant-bubble)] px-3.5 py-2.5 text-[15px] leading-[1.6] text-[color:var(--text)] shadow-[var(--shadow)] sm:px-4 sm:py-3 sm:text-[16px]">
                            {isAssistantTyping ? (
                              <span className="inline-flex items-center gap-1 text-[color:var(--text-muted)]">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--text-muted)] [animation-delay:-0.2s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--text-muted)] [animation-delay:-0.1s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[color:var(--text-muted)]" />
                              </span>
                            ) : (
                              renderMessageContent(message.content, { autoParagraph: true })
                            )}
                          </article>
                          {formatMessageTime(message.createdAt) ? (
                            <p className="mt-1 px-1 text-[10px] text-[color:var(--text-muted)]">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="ml-auto w-full max-w-[92%] min-w-0 md:max-w-[720px]">
                      <article className="rounded-[18px] border border-transparent bg-[color:var(--user-bubble)] px-3.5 py-2.5 text-[15px] leading-[1.6] text-[color:var(--accent-contrast)] shadow-[var(--shadow)] sm:px-4 sm:py-3 sm:text-[16px]">
                        {renderMessageContent(message.content)}
                      </article>
                      {formatMessageTime(message.createdAt) ? (
                        <p className="mt-1 px-1 text-right text-[10px] text-[color:var(--text-muted)]">
                          {formatMessageTime(message.createdAt)}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </div>

          {showScrollToLatest ? (
            <button
              type="button"
              onClick={() => scrollMessagesToBottom(prefersReducedMotion ? "auto" : "smooth", true)}
              className="absolute right-4 z-30 inline-flex min-h-11 items-center gap-2 rounded-full border border-[color:var(--border)] bg-[color:var(--surface)] px-4 text-[11px] font-semibold text-[color:var(--text)] shadow-[var(--shadow)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)]"
              style={{ bottom: `${composerHeight + 18}px` }}
              aria-label={t("chat_scroll_latest")}
            >
              <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true" fill="none">
                <path d="M6 8.5 10 12.5l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t("chat_scroll_latest")}
            </button>
          ) : null}

          <div
            ref={composerShellRef}
            className="absolute inset-x-0 bottom-0 z-20 border-t border-[color:var(--border)] bg-[color:var(--surface)]/96 px-3 pt-2 pb-[calc(16px+env(safe-area-inset-bottom))] shadow-[0_-10px_28px_-28px_rgba(0,0,0,0.65)] backdrop-blur sm:px-5 sm:pt-3"
          >
            <div className="flex gap-2">
              <textarea
                ref={composerRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onFocus={() => {
                  requestAnimationFrame(() => {
                    if (shouldAutoScrollRef.current) {
                      scrollMessagesToBottom("auto", true);
                    }
                  });
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return;
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isStreaming && inputValue.trim()) {
                      void sendMessage();
                    }
                  }
                }}
                rows={1}
                placeholder={uiLabels.placeholder}
                className="min-h-11 w-full resize-none rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2.5 text-[16px] leading-6 text-[color:var(--text)] outline-none transition-colors duration-200 motion-reduce:transition-none placeholder:text-[color:var(--text-muted)] focus:border-[color:var(--text)] focus-visible:ring-2 focus-visible:ring-[color:var(--text)]/15"
                aria-label={uiLabels.placeholder}
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isStreaming || !inputValue.trim()}
                className="inline-flex min-h-11 items-center justify-center rounded-[14px] bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-contrast)] shadow-[0_12px_26px_-22px_rgba(44,26,18,0.9)] transition-opacity duration-200 motion-reduce:transition-none hover:opacity-90 active:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isStreaming ? sendingLabel : uiLabels.send}
              >
                {isStreaming ? sendingLabel : uiLabels.send}
              </button>
            </div>

            {composerError ? (
              <div className="mt-2 rounded-[12px] border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                <p>{composerError}</p>
                {lastFailedMessage ? (
                  <button
                    type="button"
                    onClick={() => void sendMessage(lastFailedMessage)}
                    disabled={isStreaming}
                    className="mt-2 min-h-11 rounded-[12px] border border-rose-300 bg-white px-2.5 py-1 font-semibold text-rose-700 transition-colors duration-200 motion-reduce:transition-none hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("chat_retry")}
                  </button>
                ) : null}
              </div>
            ) : null}
            <p className="mt-2 text-[11px] leading-5 text-[color:var(--text-muted)]">{chatDisclaimer}</p>
          </div>
        </div>
      </section>

      {showAboutModal ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-sans text-lg font-semibold text-[color:var(--text)]">
                  {t("chat_about_title", { name: selectedGuideLocalized?.name ?? selectedGuideConfig?.displayName ?? selectedGuide.name })}
                </h2>
                <p className="mt-1 whitespace-pre-line text-sm text-[color:var(--text-muted)]">
                  {selectedGuideLocalized?.aboutIntro ?? selectedGuide.aboutIntro ?? selectedGuide.shortDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="min-h-11 rounded-full border border-[color:var(--border)] px-2.5 py-1 text-xs font-semibold text-[color:var(--text)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)]"
              >
                {t("common_close")}
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-muted)]">{t("chat_can_help")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--text)]">
                  {(selectedGuideLocalized?.canHelpWith ?? selectedGuide.about.canHelpWith).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[color:var(--text-muted)]">{t("chat_cannot")}</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-[color:var(--text)]">
                  {(selectedGuideLocalized?.cannotHelpWith ?? selectedGuide.about.cannotHelpWith).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 rounded-[12px] border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-xs text-[color:var(--text-muted)]">
              {chatDisclaimerLong}
            </p>
          </div>
        </div>
      ) : null}

      {showSignInPrompt ? (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-[14px] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 shadow-[var(--shadow)]">
            <h2 className="font-sans text-xl font-semibold text-[color:var(--text)]">{t("auth_continue_darshan")}</h2>
            <p className="mt-2 text-sm text-[color:var(--text-muted)]">
              {t("auth_free_limit")}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowSignInPrompt(false);
                  openAuthModal({ callbackUrl: signInCallbackUrl });
                }}
                className="min-h-11 rounded-full bg-[color:var(--accent)] px-4 py-2 text-sm font-semibold text-[color:var(--accent-contrast)] transition-opacity duration-200 motion-reduce:transition-none hover:opacity-90 active:opacity-80"
              >
                {t("auth_signin_continue")}
              </button>
              <button
                type="button"
                onClick={() => setShowSignInPrompt(false)}
                className="min-h-11 rounded-full border border-[color:var(--border)] px-4 py-2 text-sm font-semibold text-[color:var(--text)] transition-colors duration-200 motion-reduce:transition-none hover:bg-[color:var(--surface-2)]"
              >
                {t("common_maybe_later")}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
