"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { trackEvent } from "@/lib/analytics";
import {
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
        {Object.values(BHAKTI_GUIDES).map((guide) => (
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
  const selectedGuideId = isGuideId(guideParam ?? "") ? (guideParam as BhaktiGuideId) : null;
  const selectedGuide = selectedGuideId ? BHAKTI_GUIDES[selectedGuideId] : null;

  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [composerError, setComposerError] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const messagesRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLTextAreaElement | null>(null);

  const updateGuideQuery = useCallback(
    (guideId: BhaktiGuideId, keepConversationId?: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("guide", guideId);
      if (keepConversationId) {
        params.set("conversationId", keepConversationId);
      } else {
        params.delete("conversationId");
      }
      router.replace(`/bhaktigpt/chat?${params.toString()}`);
    },
    [router, searchParams]
  );

  const loadGuideConversation = useCallback(async (guideId: BhaktiGuideId, preferredConversationId?: string | null) => {
    setLoadState("loading");
    setLoadError(null);
    setComposerError(null);

    try {
      const conversationQuery = preferredConversationId ? `&conversationId=${preferredConversationId}` : "";
      const response = await fetch(`/api/bhaktigpt/chat?guideId=${guideId}${conversationQuery}`, {
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
      }
      setLoadState("ready");
    } catch (error) {
      setLoadState("error");
      setLoadError(error instanceof Error ? error.message : "Unable to load chat right now.");
    }
  }, [updateGuideQuery]);

  useEffect(() => {
    if (!selectedGuideId) {
      setLoadState("ready");
      setMessages([]);
      setConversationId(null);
      setConversations([]);
      return;
    }

    const preferredConversationId = searchParams.get("conversationId");
    void loadGuideConversation(selectedGuideId, preferredConversationId);
  }, [selectedGuideId, loadGuideConversation, searchParams]);

  useEffect(() => {
    const container = messagesRef.current;
    if (!container) return;
    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth"
    });
  }, [messages, isStreaming, loadState]);

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
    updateGuideQuery(selectedGuideId, null);
    setTimeout(() => composerRef.current?.focus(), 20);
  }, [selectedGuideId, updateGuideQuery]);

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
      if (!prefilled) setInputValue("");

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
            "I hear you. I want to guide you clearly, and I need one more detail to help well. What part of this situation feels most difficult right now?";
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
      }
    },
    [conversationId, inputValue, isStreaming, selectedGuideId, updateGuideQuery]
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
      <section className="grid h-[calc(100dvh-7.5rem)] min-h-[38rem] overflow-hidden rounded-none border border-sagar-amber/20 bg-white/95 shadow-sagar-soft md:grid-cols-[18rem_1fr] md:rounded-3xl">
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
            {Object.values(BHAKTI_GUIDES).map((guide) => {
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
                  className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${
                    active
                      ? "border-sagar-saffron/45 bg-white shadow-[0_10px_20px_-16px_rgba(94,46,16,0.55)]"
                      : "border-sagar-amber/25 bg-white/70 hover:border-sagar-amber/45"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <span className="relative h-9 w-9 overflow-hidden rounded-lg border border-sagar-amber/25">
                      <Image
                        src={guide.imageSrc}
                        alt={guide.imageAlt}
                        fill
                        className="object-cover"
                        sizes="36px"
                      />
                    </span>
                    <span>
                      <span className="block text-sm font-semibold text-sagar-ink">{guide.name}</span>
                      <span className="block text-xs text-sagar-ink/65">{guide.subtitle}</span>
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

        <div className="flex min-h-0 flex-col">
          <header className="border-b border-sagar-amber/20 px-4 py-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="relative h-10 w-10 overflow-hidden rounded-xl border border-sagar-amber/25">
                  <Image
                    src={selectedGuide.imageSrc}
                    alt={selectedGuide.imageAlt}
                    fill
                    className="object-cover"
                    sizes="40px"
                    priority
                  />
                </span>
                <div>
                  <p className="text-sm font-semibold text-sagar-ink">{selectedGuide.name}</p>
                  <p className="text-xs text-sagar-ink/70">{selectedGuide.subtitle}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={startNewChat}
                  className="rounded-full border border-sagar-amber/30 px-3 py-1.5 text-xs font-semibold text-sagar-ink/80 md:hidden"
                >
                  New chat
                </button>
                <button
                  type="button"
                  onClick={() => setShowAboutModal(true)}
                  className="rounded-full border border-sagar-amber/30 px-3 py-1.5 text-xs font-semibold text-sagar-ink/80"
                >
                  About
                </button>
              </div>
            </div>
          </header>

          <div ref={messagesRef} className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
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
              <div className="space-y-4 rounded-2xl border border-sagar-amber/20 bg-sagar-cream/40 p-4">
                <div>
                  <p className="text-sm font-semibold text-sagar-ink">Start your conversation with {selectedGuide.name}</p>
                  <p className="mt-1 text-sm text-sagar-ink/75">{selectedGuide.shortDescription}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedGuide.promptChips.map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => void sendMessage(chip)}
                      disabled={isStreaming}
                      className="rounded-full border border-sagar-amber/30 bg-white px-3 py-1.5 text-xs text-sagar-ink/85 transition hover:border-sagar-saffron/45 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {chip}
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

                  return (
                    <article
                      key={message.id}
                      className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        message.role === "user"
                          ? "ml-auto border border-sagar-saffron/35 bg-sagar-saffron/10 text-sagar-ink"
                          : "border border-sagar-amber/20 bg-white text-sagar-ink/90"
                      }`}
                    >
                      {isAssistantTyping ? (
                        <span className="inline-flex items-center gap-1 text-sagar-ink/70">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sagar-ember [animation-delay:-0.2s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sagar-ember [animation-delay:-0.1s]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-sagar-ember" />
                        </span>
                      ) : (
                        <p className="whitespace-pre-line">{message.content}</p>
                      )}
                    </article>
                  );
                })
              : null}
          </div>

          <div className="border-t border-sagar-amber/20 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
            <div className="mb-2 flex flex-wrap gap-2">
              {selectedGuide.promptChips.map((chip) => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => void sendMessage(chip)}
                  disabled={isStreaming}
                  className="rounded-full border border-sagar-amber/28 bg-white px-3 py-1.5 text-xs text-sagar-ink/80 transition hover:border-sagar-saffron/45 hover:bg-sagar-cream/50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <textarea
                ref={composerRef}
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    if (!isStreaming && inputValue.trim()) {
                      void sendMessage();
                    }
                  }
                }}
                rows={2}
                placeholder="Type your message..."
                disabled={isStreaming}
                className="w-full resize-none rounded-xl border border-sagar-amber/25 bg-white px-3 py-2 text-sm text-sagar-ink outline-none transition focus:border-sagar-saffron/60"
              />
              <button
                type="button"
                onClick={() => void sendMessage()}
                disabled={isStreaming || !inputValue.trim()}
                className="h-fit rounded-xl bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isStreaming ? "Sending..." : "Send"}
              </button>
            </div>

            {composerError ? (
              <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                {composerError}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {showAboutModal ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-sagar-ink/45 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-sagar-ink">About {selectedGuide.name}</h2>
                <p className="mt-1 text-sm text-sagar-ink/70">{selectedGuide.shortDescription}</p>
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
    </>
  );
}
