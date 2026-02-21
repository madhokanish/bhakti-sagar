"use client";

import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import { getGuideConfig } from "@/lib/bhaktigpt/guideConfig";
import {
  BHAKTI_GUIDE_LIST,
  BHAKTI_GUIDES,
  BHAKTIGPT_DISCLAIMER,
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

const MOBILE_SUGGESTED_PROMPTS = [
  "I feel stuck, help me take the next step",
  "I am anxious about money, what should I focus on",
  "I need clarity on a decision"
];
const CHAT_DISCLAIMER =
  "Inspired by scripture and traditions. Not medical, legal, or financial advice.";

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
          className="max-w-full break-all underline underline-offset-2 transition hover:text-sagar-ember"
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
    <div className="max-w-full space-y-3 break-words [overflow-wrap:anywhere] [word-break:break-word] [&_a]:break-all [&_code]:max-w-full [&_code]:break-words [&_p]:max-w-full [&_pre]:max-w-full [&_pre]:overflow-x-auto">
      {paragraphs.map((paragraph, paragraphIndex) => {
        const lines = paragraph.split("\n");

        return (
          <p key={`${paragraphIndex}-${paragraph.slice(0, 16)}`} className="leading-relaxed text-inherit">
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
        className={`inline-flex ${sizeClass} items-center justify-center rounded-full border border-sagar-amber/30 bg-sagar-cream text-xs font-semibold text-sagar-ink ${className}`}
      >
        {initial}
      </span>
    );
  }

  return (
    <span
      className={`relative inline-block ${sizeClass} overflow-hidden rounded-full border border-sagar-amber/30 shadow-[0_6px_16px_-12px_rgba(0,0,0,0.5)] ${className}`}
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

function GuidePicker({ onPick }: { onPick: (guideId: BhaktiGuideId) => void }) {
  return (
    <section className="space-y-4 rounded-3xl border border-sagar-amber/20 bg-white/90 p-5 shadow-sagar-soft">
      <header>
        <h1 className="text-2xl font-semibold text-sagar-ink">Choose your BhaktiGPT guide</h1>
        <p className="mt-2 text-sm text-sagar-ink/75">
          Pick one guide to start. Each guide has separate chat history and memory.
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-3">
        {BHAKTI_GUIDE_LIST.map((guide) => (
          <button
            key={guide.id}
            type="button"
            onClick={() => onPick(guide.id)}
            className="overflow-hidden rounded-2xl border border-sagar-amber/20 bg-white text-left shadow-sagar-soft transition hover:-translate-y-0.5 hover:border-sagar-saffron/45"
          >
            <div className="relative h-40">
              <Image
                src={guide.imageSrc}
                alt={guide.imageAlt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2f1408]/80 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-white">
                <p className="text-sm font-semibold">{guide.name}</p>
                <p className="text-xs text-white/90">{guide.subtitle}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-sagar-ink/80">{guide.shortDescription}</p>
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}

export default function BhaktiGptChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const guideParam = searchParams.get("guide");
  const prefillParam = searchParams.get("prefill");
  const selectedGuideId = isGuideId(guideParam ?? "") ? (guideParam as BhaktiGuideId) : null;
  const selectedGuide = selectedGuideId ? BHAKTI_GUIDES[selectedGuideId] : null;
  const selectedGuideConfig = selectedGuideId ? getGuideConfig(selectedGuideId) : null;

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

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);
  const composerShellRef = useRef<HTMLDivElement | null>(null);
  const handledPrefillRef = useRef<string | null>(null);
  const [composerHeight, setComposerHeight] = useState(124);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const previousNavHeight = root.style.getPropertyValue("--nav-height");
    const previousRibbonHeight = root.style.getPropertyValue("--promo-ribbon-height");

    body.setAttribute("data-bhaktigpt-chat", "on");
    root.style.setProperty("--nav-height", "0px");
    root.style.setProperty("--promo-ribbon-height", "0px");

    return () => {
      body.removeAttribute("data-bhaktigpt-chat");
      if (previousNavHeight) {
        root.style.setProperty("--nav-height", previousNavHeight);
      } else {
        root.style.removeProperty("--nav-height");
      }
      if (previousRibbonHeight) {
        root.style.setProperty("--promo-ribbon-height", previousRibbonHeight);
      } else {
        root.style.removeProperty("--promo-ribbon-height");
      }
    };
  }, []);

  const focusComposer = useCallback(() => {
    requestAnimationFrame(() => composerRef.current?.focus());
  }, []);

  const scrollMessagesToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = messagesRef.current;
    if (!container) return;
    requestAnimationFrame(() => {
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    });
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
      const params = new URLSearchParams(searchParams.toString());
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
      router.replace(`/bhaktigpt/chat?${params.toString()}`);
    },
    [router, searchParams]
  );

  const loadGuideConversation = useCallback(async (
    guideId: BhaktiGuideId,
    preferredConversationId?: string | null,
    forceNewConversation = false
  ) => {
    setLoadState("loading");
    setLoadError(null);
    setComposerError(null);

    try {
      const conversationQuery = preferredConversationId ? `&conversationId=${preferredConversationId}` : "";
      const newQuery = forceNewConversation ? "&new=1" : "";
      const response = await fetch(`/api/bhaktigpt/chat?guideId=${guideId}${conversationQuery}${newQuery}`, {
        method: "GET",
        cache: "no-store"
      });
      const raw = await parseJsonSafe(response);
      if (!response.ok) {
        const errorMessage =
          (raw && typeof raw.error === "string" && raw.error) ||
          "Unable to load chat right now.";
        throw new Error(errorMessage);
      }
      if (!raw) throw new Error("Unable to load chat right now.");

      const data = raw as unknown as InitialResponse;
      const nextConversationId = data.conversationId || null;
      setConversations(data.conversations || []);
      setMessages(data.messages || []);
      setConversationId(nextConversationId);
      if (nextConversationId) {
        updateGuideQuery(guideId, nextConversationId);
      } else if (forceNewConversation) {
        updateGuideQuery(guideId, null, { forceNewConversation: true });
      }
      setLoadState("ready");
      focusComposer();
    } catch (error) {
      setLoadState("error");
      setLoadError(error instanceof Error ? error.message : "Unable to load chat right now.");
    }
  }, [focusComposer, updateGuideQuery]);

  useEffect(() => {
    if (!selectedGuideId) {
      setLoadState("ready");
      setMessages([]);
      setConversationId(null);
      setConversations([]);
      return;
    }

    const preferredConversationId = searchParams.get("conversationId");
    const forceNewConversation = searchParams.get("new") === "1";
    void loadGuideConversation(selectedGuideId, preferredConversationId, forceNewConversation);
  }, [selectedGuideId, loadGuideConversation, searchParams]);

  useEffect(() => {
    if (!selectedGuideId || !prefillParam) return;

    const prefillKey = `${selectedGuideId}:${prefillParam}`;
    if (handledPrefillRef.current === prefillKey) return;

    handledPrefillRef.current = prefillKey;
    setInputValue((current) => (current.trim().length ? current : prefillParam));
    requestAnimationFrame(() => composerRef.current?.focus());

    const params = new URLSearchParams(searchParams.toString());
    params.delete("prefill");
    router.replace(`/bhaktigpt/chat?${params.toString()}`);
  }, [prefillParam, router, searchParams, selectedGuideId]);

  useEffect(() => {
    if (loadState !== "ready") return;
    scrollMessagesToBottom(isStreaming ? "auto" : "smooth");
  }, [isStreaming, loadState, messages, scrollMessagesToBottom]);

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

  const openConversation = useCallback(
    async (id: string) => {
      if (!selectedGuideId) return;
      setConversationId(id);
      updateGuideQuery(selectedGuideId, id);
      await loadGuideConversation(selectedGuideId, id);
    },
    [loadGuideConversation, selectedGuideId, updateGuideQuery]
  );

  const startNewChat = useCallback(() => {
    if (!selectedGuideId) return;
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
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/");
  }, [router]);

  const sendMessage = useCallback(
    async (prefilled?: string) => {
      if (!selectedGuideId) return;

      const value = (prefilled ?? inputValue).trim();
      if (!value || isStreaming) return;

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
            message: value
          })
        });

        if (!response.ok) {
          const raw = await parseJsonSafe(response);
          const message =
            (raw && typeof raw.error === "string" && raw.error) || "Unable to send message.";
          throw new Error(message);
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("text/event-stream")) {
          const raw = await parseJsonSafe(response);
          if (!raw) throw new Error("Invalid chat response.");
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
                : "Unable to process your message right now.";
            throw new Error(message);
          }
        });

        if (!streamedText.trim()) {
          const fallback =
            "I see what you mean.\n\nGive me one concrete detail, and I will guide you clearly.\n\nWhat is the sharpest part of this situation right now?";
          setMessages((prev) =>
            prev.map((item) => (item.id === assistantMessageId ? { ...item, content: fallback } : item))
          );
        }

        trackEvent("sent_message", { guideId: selectedGuideId });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unable to process your message right now.";
        setComposerError(errorMessage);
        setMessages((prev) =>
          prev.map((item) =>
            item.id === assistantMessageId
              ? { ...item, content: "I could not respond just now. Please send that again." }
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
      selectedGuideId,
      updateGuideQuery
    ]
  );

  if (!selectedGuideId || !selectedGuide) {
    return (
      <GuidePicker
        onPick={(guideId) => {
          trackEvent("selected_guide", { guideId, source: "guide_picker" });
          updateGuideQuery(guideId);
        }}
      />
    );
  }

  return (
    <>
      <section className="grid h-full min-h-0 min-w-0 overflow-x-hidden overflow-y-hidden rounded-none bg-white md:grid-cols-[18rem_1fr] md:rounded-3xl md:border md:border-sagar-amber/20 md:bg-white/95 md:shadow-sagar-soft">
        <aside className="hidden border-r border-sagar-amber/20 bg-sagar-cream/30 p-3 md:flex md:flex-col">
          <h2 className="px-2 text-sm font-semibold uppercase tracking-[0.12em] text-sagar-rose">BhaktiGPT</h2>
          <button
            type="button"
            onClick={startNewChat}
            className="mt-3 rounded-xl bg-sagar-saffron px-3 py-2 text-sm font-semibold text-white hover:bg-sagar-ember"
          >
            New chat
          </button>

          <div className="mt-4 space-y-2">
            {BHAKTI_GUIDE_LIST.map((guide) => {
              const active = guide.id === selectedGuideId;
              const guideConfig = getGuideConfig(guide.id);
              return (
                <button
                  key={guide.id}
                  type="button"
                  onClick={() => {
                    if (guide.id === selectedGuideId) return;
                    trackEvent("selected_guide", { guideId: guide.id, source: "sidebar" });
                    updateGuideQuery(guide.id);
                  }}
                  className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${
                    active
                      ? "border-sagar-saffron/45 bg-white shadow-[0_10px_20px_-16px_rgba(94,46,16,0.55)]"
                      : "border-sagar-amber/25 bg-white/70 hover:border-sagar-amber/45"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <GuideAvatar guideId={guide.id} size="sm" className="rounded-lg" />
                    <span>
                      <span className="block text-sm font-semibold text-sagar-ink">{guideConfig.displayName}</span>
                      <span className="block text-xs text-sagar-ink/65">{guideConfig.subtitle}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-4 border-t border-sagar-amber/20 pt-3">
            <p className="px-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-sagar-rose">Recent</p>
            <div className="mt-2 space-y-1">
              {conversations.length === 0 ? (
                <p className="px-2 text-xs text-sagar-ink/60">No saved threads yet.</p>
              ) : (
                conversations.slice(0, 10).map((conversation) => (
                  <button
                    key={conversation.id}
                    type="button"
                    onClick={() => void openConversation(conversation.id)}
                    className={`w-full rounded-lg border px-2 py-1.5 text-left text-xs transition ${
                      conversation.id === conversationId
                        ? "border-sagar-saffron/45 bg-white"
                        : "border-sagar-amber/20 bg-white/60 hover:border-sagar-amber/45"
                    }`}
                  >
                    {conversation.title || "Untitled"}
                  </button>
                ))
              )}
            </div>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
          <header className="shrink-0 border-b border-sagar-amber/20 bg-white px-3 py-2.5 sm:px-6 sm:py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-sagar-amber/30 text-sagar-ink/80 md:hidden"
                  aria-label="Go back"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="h-5 w-5"
                  >
                    <path
                      fillRule="evenodd"
                      d="M11.78 3.22a.75.75 0 0 1 0 1.06L6.06 10l5.72 5.72a.75.75 0 0 1-1.06 1.06l-6.25-6.25a.75.75 0 0 1 0-1.06l6.25-6.25a.75.75 0 0 1 1.06 0Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
                <GuideAvatar guideId={selectedGuideId} size="sm" className="md:h-10 md:w-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-sagar-ink">{selectedGuideConfig?.displayName}</p>
                  <p className="text-[11px] text-sagar-ink/65">Online guide</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="rounded-full border border-sagar-amber/30 px-3 py-2 text-xs font-semibold text-sagar-ink/80"
                >
                  New chat
                </button>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="hidden rounded-full border border-sagar-amber/30 px-3 py-2 text-xs font-semibold text-sagar-ink/80 sm:inline-flex"
                >
                  About
                </button>
              </div>
            </div>
          </header>

          <div
            ref={messagesRef}
            className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-3 py-3 text-[15px] leading-7 [overscroll-behavior-y:contain] [touch-action:pan-y] sm:px-6 sm:py-4 sm:text-base"
            style={{ paddingBottom: `${composerHeight + 24}px` }}
          >
            {loadState === "loading" ? (
              <div className="space-y-3">
                <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-sagar-cream/70" />
                <div className="ml-auto h-14 w-1/2 animate-pulse rounded-2xl bg-sagar-saffron/15" />
                <div className="h-16 w-3/5 animate-pulse rounded-2xl bg-sagar-cream/70" />
              </div>
            ) : null}

            {loadState === "error" ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
                <p>{loadError}</p>
                <button
                  type="button"
                  onClick={() => void loadGuideConversation(selectedGuideId)}
                  className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {loadState === "ready" && messages.length === 0 ? (
              <div className="space-y-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4 sm:p-5">
                <div>
                  <p className="text-sm font-semibold text-sagar-ink">
                    Start your conversation with {selectedGuide.name}
                  </p>
                  <p className="mt-1 text-sm text-sagar-ink/75">{selectedGuide.shortDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {MOBILE_SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => void sendMessage(prompt)}
                      disabled={isStreaming}
                      className="min-h-11 rounded-full border border-sagar-amber/30 bg-white px-3 py-2 text-left text-xs text-sagar-ink/80 transition hover:border-sagar-saffron/45 hover:bg-sagar-cream/40 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-sagar-ink/60">{BHAKTIGPT_DISCLAIMER}</p>
              </div>
            ) : null}

            {loadState === "ready"
              ? messages.map((message) => {
                  const isAssistantTyping =
                    message.role === "assistant" && isStreaming && message.content.trim().length === 0;

                  if (message.role === "assistant") {
                    return (
                      <div key={message.id} className="flex w-full max-w-[85%] min-w-0 items-start gap-3 sm:max-w-[80%] md:gap-4">
                        <GuideAvatar guideId={selectedGuideId} size="sm" className="mt-0.5 shrink-0 md:h-10 md:w-10" />
                        <div className="min-w-0 w-full">
                          <article className="w-full min-w-0 rounded-2xl border border-sagar-amber/20 bg-white px-4 py-3 text-[15px] leading-7 text-sagar-ink/90 sm:text-base">
                            {isAssistantTyping ? (
                              <span className="inline-flex items-center gap-1 text-sagar-ink/70">
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sagar-ember [animation-delay:-0.2s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sagar-ember [animation-delay:-0.1s]" />
                                <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sagar-ember" />
                              </span>
                            ) : (
                              renderMessageContent(message.content, { autoParagraph: true })
                            )}
                          </article>
                          {formatMessageTime(message.createdAt) ? (
                            <p className="mt-1 px-1 text-[10px] text-sagar-ink/45">
                              {formatMessageTime(message.createdAt)}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={message.id} className="ml-auto max-w-[85%] min-w-0 sm:max-w-[80%]">
                      <article className="rounded-2xl border border-sagar-saffron/35 bg-sagar-saffron/10 px-4 py-3 text-[15px] leading-7 text-sagar-ink sm:text-base">
                        {renderMessageContent(message.content)}
                      </article>
                      {formatMessageTime(message.createdAt) ? (
                        <p className="mt-1 px-1 text-right text-[10px] text-sagar-ink/45">
                          {formatMessageTime(message.createdAt)}
                        </p>
                      ) : null}
                    </div>
                  );
                })
              : null}
          </div>

          <div
            ref={composerShellRef}
            className="shrink-0 border-t border-sagar-amber/20 bg-white px-3 pt-2 pb-[calc(12px+env(safe-area-inset-bottom))] sm:px-6 sm:pt-3"
          >
            <div className="flex gap-2">
              <textarea
                ref={composerRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
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
                placeholder="Share what's on your mind..."
                className="min-h-11 w-full resize-none rounded-xl border border-sagar-amber/25 bg-white px-3 py-2.5 text-[16px] leading-6 text-sagar-ink outline-none transition focus:border-sagar-saffron/60"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isStreaming || !inputValue.trim()}
                className="inline-flex min-h-11 items-center justify-center rounded-xl bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStreaming ? "Sending..." : "Send"}
              </button>
            </div>

            {composerError ? (
              <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {composerError}
              </p>
            ) : null}
            <p className="mt-2 text-[11px] leading-5 text-sagar-ink/60">{CHAT_DISCLAIMER}</p>
          </div>
        </div>
      </section>

      {showAboutModal ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-sagar-ink/45 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-sagar-ink">{`About ${selectedGuideConfig?.displayName ?? selectedGuide.name}`}</h2>
                <p className="mt-1 text-sm whitespace-pre-line text-sagar-ink/70">
                  {selectedGuide.aboutIntro ?? selectedGuide.shortDescription}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAboutModal(false)}
                className="rounded-full border border-sagar-amber/30 px-2.5 py-1 text-xs font-semibold text-sagar-ink/70"
              >
                Close
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sagar-rose">Can help with</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sagar-ink/80">
                  {selectedGuide.about.canHelpWith.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sagar-rose">Cannot do</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sagar-ink/80">
                  {selectedGuide.about.cannotHelpWith.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="mt-4 rounded-xl border border-sagar-amber/20 bg-sagar-cream/50 px-3 py-2 text-xs text-sagar-ink/75">
              {BHAKTIGPT_DISCLAIMER}
            </p>
          </div>
        </div>
      ) : null}

      {showSignInPrompt ? (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-sagar-ink/40 p-4">
          <div className="w-full max-w-md rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]">
            <h2 className="text-xl font-serif text-sagar-ink">Continue your darshan</h2>
            <p className="mt-2 text-sm text-sagar-ink/75">
              You have used your free messages for now. Sign in to continue your devotional conversation.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href="/signin?callbackUrl=/bhaktigpt/chat"
                className="rounded-full bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
              >
                Sign in to continue
              </a>
              <button
                type="button"
                onClick={() => setShowSignInPrompt(false)}
                className="rounded-full border border-sagar-amber/30 px-4 py-2 text-sm font-semibold text-sagar-ink/80"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
