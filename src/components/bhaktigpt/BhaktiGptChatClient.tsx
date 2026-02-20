"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { signIn } from "next-auth/react";
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
  isAuthenticated: boolean;
  remaining: number;
  used: number;
  limitReached: boolean;
};

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
  return `msg_${Date.now()}`;
}

function formatUpdatedAt(dateString: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(dateString));
}

export default function BhaktiGptChatClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const guideParam = searchParams.get("guide");
  const conversationParam = searchParams.get("conversationId");

  const initialGuide: BhaktiGuideId = isGuideId(guideParam ?? "")
    ? (guideParam as BhaktiGuideId)
    : "krishna";

  const [selectedGuide, setSelectedGuide] = useState<BhaktiGuideId>(initialGuide);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(conversationParam);
  const [inputValue, setInputValue] = useState("");
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [freeUsed, setFreeUsed] = useState(0);
  const [freeRemaining, setFreeRemaining] = useState(3);
  const [showGateModal, setShowGateModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  const guide = BHAKTI_GUIDES[selectedGuide];

  const callbackUrl = useMemo(() => {
    if (typeof window === "undefined") return "/bhaktigpt/chat";
    return window.location.href;
  }, []);

  const loadInitial = useCallback(
    async (targetConversationId?: string | null) => {
      setLoadingInitial(true);
      setError(null);
      try {
        const query = targetConversationId ? `?conversationId=${targetConversationId}` : "";
        const response = await fetch(`/api/bhaktigpt/chat${query}`, { method: "GET", cache: "no-store" });
        const raw = await parseJsonSafe(response);
        if (!response.ok) {
          const message =
            (raw && typeof raw.error === "string" && raw.error) || "Unable to load chat.";
          throw new Error(message);
        }
        if (!raw) {
          throw new Error("Unable to load chat.");
        }
        const data = raw as unknown as InitialResponse;
        setConversations(data.conversations);
        setMessages(data.messages);
        setIsAuthenticated(data.isAuthenticated);
        setFreeRemaining(data.remaining ?? 0);
        setFreeUsed(data.used ?? 0);
        if (targetConversationId && data.messages.length === 0) {
          setConversationId(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load chat.");
      } finally {
        setLoadingInitial(false);
      }
    },
    []
  );

  useEffect(() => {
    void loadInitial(conversationParam);
  }, [conversationParam, loadInitial]);

  useEffect(() => {
    setSelectedGuide(initialGuide);
  }, [initialGuide]);

  function updateUrl(next: { guide?: BhaktiGuideId; conversationId?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.guide) params.set("guide", next.guide);
    if (next.conversationId) params.set("conversationId", next.conversationId);
    else params.delete("conversationId");
    router.replace(`/bhaktigpt/chat?${params.toString()}`);
  }

  function handleGuideChange(nextGuide: BhaktiGuideId) {
    setSelectedGuide(nextGuide);
    trackEvent("selected_guide", { guideId: nextGuide });
    updateUrl({ guide: nextGuide, conversationId: conversationId });
  }

  async function openConversation(id: string, guideId: BhaktiGuideId) {
    setConversationId(id);
    setSelectedGuide(guideId);
    updateUrl({ guide: guideId, conversationId: id });
    await loadInitial(id);
  }

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setError(null);
    updateUrl({ guide: selectedGuide, conversationId: null });
  }

  async function sendMessage(prefilled?: string) {
    const value = (prefilled ?? inputValue).trim();
    if (!value || sending) return;

    setSending(true);
    setError(null);

    try {
      const response = await fetch("/api/bhaktigpt/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guideId: selectedGuide,
          conversationId,
          message: value
        })
      });

      const data = await parseJsonSafe(response);

      if (!response.ok) {
        const message =
          (data && typeof data.error === "string" && data.error) || "Unable to send message.";
        throw new Error(message);
      }

      if (!data) {
        throw new Error("Unable to send message.");
      }

      if (data.limitReached === true) {
        setShowGateModal(true);
        setFreeRemaining(0);
        setFreeUsed(3);
        trackEvent("hit_gate", { guideId: selectedGuide });
        return;
      }

      const userMessage: ChatMessage = {
        id: generateLocalId(),
        role: "user",
        content: value,
        createdAt: new Date().toISOString()
      };
      const assistantText =
        typeof data.assistantMessage === "string"
          ? data.assistantMessage
          : "I hear you. Please try again in a moment.";

      const assistantMessage: ChatMessage = {
        id: generateLocalId(),
        role: "assistant",
        content: assistantText,
        createdAt: new Date().toISOString()
      };

      setMessages((prev) => [...prev, userMessage, assistantMessage]);

      if (typeof data.conversationId === "string" && data.conversationId !== conversationId) {
        setConversationId(data.conversationId);
        updateUrl({ guide: selectedGuide, conversationId: data.conversationId });
      }

      if (!isAuthenticated) {
        if (typeof data.remaining === "number") {
          setFreeRemaining(data.remaining);
          if (data.remaining <= 0) {
            setShowGateModal(true);
            trackEvent("hit_gate", { guideId: selectedGuide, reason: "limit_reached_after_send" });
          }
        }
        if (typeof data.used === "number") setFreeUsed(data.used);
      }

      if (!conversationId && typeof data.conversationId === "string") {
        void loadInitial(data.conversationId);
      }

      setInputValue("");
      trackEvent("sent_message", { guideId: selectedGuide, authenticated: isAuthenticated });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send message.");
    } finally {
      setSending(false);
    }
  }

  const subtleCounter = !isAuthenticated && freeUsed >= 2;

  return (
    <div className="grid min-h-[calc(100vh-14rem)] gap-4 lg:grid-cols-[18rem_1fr]">
      <aside className="rounded-3xl border border-sagar-amber/20 bg-white/85 p-4 shadow-sagar-soft">
        <button
          type="button"
          onClick={startNewChat}
          className="mb-4 w-full rounded-xl bg-sagar-saffron px-3 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember"
        >
          New chat
        </button>

        <div className="space-y-2">
          {Object.values(BHAKTI_GUIDES).map((item) => {
            const active = item.id === selectedGuide;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleGuideChange(item.id)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left transition ${
                  active
                    ? "border-sagar-saffron/45 bg-sagar-cream/70"
                    : "border-sagar-amber/20 bg-white hover:border-sagar-amber/45"
                }`}
              >
                <p className="text-sm font-semibold text-sagar-ink">{item.name}</p>
                <p className="mt-0.5 text-xs text-sagar-ink/70">{item.subtitle}</p>
              </button>
            );
          })}
        </div>

        <div className="mt-5 border-t border-sagar-amber/20 pt-4">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-sagar-rose">Recent chats</p>
          <div className="mt-2 space-y-2">
            {conversations.length === 0 ? (
              <p className="text-xs text-sagar-ink/65">No chats yet.</p>
            ) : (
              conversations.slice(0, 8).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => openConversation(item.id, item.guideId)}
                  className={`w-full rounded-xl border px-2.5 py-2 text-left transition ${
                    item.id === conversationId
                      ? "border-sagar-saffron/40 bg-sagar-cream/65"
                      : "border-sagar-amber/20 bg-white hover:border-sagar-amber/45"
                  }`}
                >
                  <p className="line-clamp-2 text-xs font-medium text-sagar-ink">
                    {item.title || "Untitled reflection"}
                  </p>
                  <p className="mt-1 text-[11px] text-sagar-ink/60">{formatUpdatedAt(item.updatedAt)}</p>
                </button>
              ))
            )}
          </div>
        </div>
      </aside>

      <section className="flex min-h-[68vh] flex-col rounded-3xl border border-sagar-amber/20 bg-white/88 shadow-sagar-soft">
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-sagar-amber/15 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-lg font-semibold text-sagar-ink">{guide.name}</h1>
            <p className="text-sm text-sagar-ink/70">{guide.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => setShowAboutModal(true)}
            className="text-xs font-semibold uppercase tracking-[0.14em] text-sagar-ember hover:text-sagar-saffron"
          >
            About this guide
          </button>
        </header>

        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          {loadingInitial ? (
            <div className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/45 p-4 text-sm text-sagar-ink/70">
              Loading your chat...
            </div>
          ) : messages.length === 0 ? (
            <div className="rounded-2xl border border-sagar-amber/15 bg-sagar-cream/45 p-4 text-sm text-sagar-ink/75">
              <p>
                {guide.shortDescription}
              </p>
              <p className="mt-3 text-xs text-sagar-ink/65">{BHAKTIGPT_DISCLAIMER}</p>
            </div>
          ) : (
            messages.map((message) => (
              <article
                key={message.id}
                className={`max-w-3xl rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "ml-auto border border-sagar-saffron/35 bg-sagar-saffron/10 text-sagar-ink"
                    : "border border-sagar-amber/20 bg-white text-sagar-ink/90"
                }`}
              >
                <p className="whitespace-pre-line">{message.content}</p>
              </article>
            ))
          )}
          {error ? (
            <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </div>

        <div className="border-t border-sagar-amber/15 px-4 py-3 sm:px-6">
          <div className="mb-2 flex flex-wrap gap-2">
            {guide.promptChips.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => sendMessage(chip)}
                disabled={sending || (!isAuthenticated && freeRemaining <= 0)}
                className="rounded-full border border-sagar-amber/28 bg-white px-3 py-1.5 text-xs text-sagar-ink/80 transition hover:border-sagar-saffron/45 hover:bg-sagar-cream/50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {chip}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <textarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              rows={2}
              placeholder="Share what is on your mind..."
              disabled={sending || (!isAuthenticated && freeRemaining <= 0)}
              className="w-full resize-none rounded-xl border border-sagar-amber/25 bg-white px-3 py-2 text-sm text-sagar-ink outline-none transition focus:border-sagar-saffron/60"
            />
            <button
              type="button"
              onClick={() => sendMessage()}
              disabled={sending || !inputValue.trim() || (!isAuthenticated && freeRemaining <= 0)}
              className="h-fit rounded-xl bg-sagar-saffron px-4 py-2 text-sm font-semibold text-white transition hover:bg-sagar-ember disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? "Sending..." : "Send"}
            </button>
          </div>

          {subtleCounter ? (
            <p className="mt-2 text-xs text-sagar-ink/70">{freeUsed} of 3 free messages used.</p>
          ) : null}
        </div>
      </section>

      {showAboutModal ? (
        <div className="fixed inset-0 z-[95] flex items-center justify-center bg-sagar-ink/45 p-4">
          <div className="w-full max-w-lg rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-sagar-ink">About {guide.name}</h2>
                <p className="mt-1 text-sm text-sagar-ink/70">{guide.shortDescription}</p>
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
                  {guide.about.canHelpWith.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-sagar-rose">Cannot do</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-sagar-ink/80">
                  {guide.about.cannotHelpWith.map((item) => (
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

      {showGateModal ? (
        <div className="fixed inset-0 z-[96] flex items-center justify-center bg-sagar-ink/50 p-4">
          <div className="w-full max-w-md rounded-3xl border border-sagar-amber/25 bg-white p-5 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.55)]">
            <h2 className="text-xl font-semibold text-sagar-ink">Continue your spiritual journey</h2>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-sagar-ink/80">
              <li>Save your reflections</li>
              <li>Continue unlimited chats</li>
              <li>Access across devices</li>
              <li>Private and secure</li>
            </ul>

            <div className="mt-4 space-y-2">
              <button
                type="button"
                onClick={() => {
                  trackEvent("started_signin", { provider: "google", source: "gate_modal" });
                  void signIn("google", { callbackUrl });
                }}
                className="w-full rounded-xl border border-sagar-amber/30 bg-white px-3 py-2 text-sm font-semibold text-sagar-ink hover:border-sagar-saffron/50"
              >
                Continue with Google
              </button>
              <button
                type="button"
                onClick={() => {
                  trackEvent("started_signin", { provider: "apple", source: "gate_modal" });
                  void signIn("apple", { callbackUrl });
                }}
                className="w-full rounded-xl bg-sagar-ink px-3 py-2 text-sm font-semibold text-white"
              >
                Continue with Apple
              </button>
              <button
                type="button"
                onClick={() => {
                  trackEvent("started_signin", { provider: "email", source: "gate_modal" });
                  router.push(`/signin?mode=signup&callbackUrl=${encodeURIComponent(callbackUrl)}`);
                }}
                className="w-full rounded-xl border border-sagar-amber/30 bg-sagar-cream/45 px-3 py-2 text-sm font-semibold text-sagar-ink"
              >
                Continue with Email
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowGateModal(false)}
              className="mt-4 w-full text-xs font-semibold uppercase tracking-[0.14em] text-sagar-ink/60"
            >
              Maybe later
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
