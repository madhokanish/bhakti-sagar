"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";
import { usePathname, useRouter } from "next/navigation";
import AuthModal from "@/components/auth/AuthModal";

type OpenAuthModalOptions = {
  callbackUrl?: string;
};

type AuthModalContextValue = {
  isOpen: boolean;
  callbackUrl: string;
  openAuthModal: (options?: OpenAuthModalOptions) => void;
  closeAuthModal: () => void;
};

const AuthModalContext = createContext<AuthModalContextValue | null>(null);

function sanitizeCallbackUrl(rawValue: string | null | undefined, fallback: string) {
  if (!rawValue) return fallback;
  const trimmed = rawValue.trim();
  if (!trimmed) return fallback;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    if (typeof window !== "undefined") {
      const parsed = new URL(trimmed, window.location.origin);
      if (parsed.origin === window.location.origin) {
        return `${parsed.pathname}${parsed.search}${parsed.hash}`;
      }
    }
  } catch {
    // noop
  }

  return fallback;
}

function getCurrentPathFallback(pathname: string) {
  if (typeof window === "undefined") return pathname;

  const url = new URL(window.location.href);
  const params = new URLSearchParams(url.search);
  params.delete("auth");
  params.delete("callbackUrl");
  const query = params.toString();
  return query ? `${url.pathname}?${query}` : url.pathname;
}

function getAuthQueryValues() {
  if (typeof window === "undefined") {
    return {
      shouldOpen: false,
      callbackUrl: null as string | null,
      key: null as string | null
    };
  }

  const url = new URL(window.location.href);
  const shouldOpen = url.searchParams.get("auth") === "1";

  return {
    shouldOpen,
    callbackUrl: url.searchParams.get("callbackUrl"),
    key: `${url.pathname}${url.search}`
  };
}

export default function AuthModalProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [isOpen, setIsOpen] = useState(false);
  const [callbackUrl, setCallbackUrl] = useState("/");

  const lastAutoOpenKeyRef = useRef<string | null>(null);

  const closeAuthModal = useCallback(() => {
    setIsOpen(false);

    if (typeof window === "undefined") return;

    const url = new URL(window.location.href);
    if (url.searchParams.get("auth") !== "1") return;

    url.searchParams.delete("auth");
    url.searchParams.delete("callbackUrl");

    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    router.replace(nextPath || pathname, { scroll: false });
  }, [pathname, router]);

  const openAuthModal = useCallback(
    (options?: OpenAuthModalOptions) => {
      const fallback = getCurrentPathFallback(pathname);
      const nextCallback = sanitizeCallbackUrl(options?.callbackUrl ?? null, fallback);
      setCallbackUrl(nextCallback);
      setIsOpen(true);
    },
    [pathname]
  );

  const syncFromUrl = useCallback(() => {
    const query = getAuthQueryValues();

    if (!query.shouldOpen) {
      lastAutoOpenKeyRef.current = null;
      return;
    }

    if (query.key && lastAutoOpenKeyRef.current === query.key) return;
    lastAutoOpenKeyRef.current = query.key;

    const fallback = getCurrentPathFallback(pathname);
    const nextCallback = sanitizeCallbackUrl(query.callbackUrl, fallback);
    setCallbackUrl(nextCallback);
    setIsOpen(true);
  }, [pathname]);

  useEffect(() => {
    syncFromUrl();
  }, [pathname, syncFromUrl]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onPopState = () => syncFromUrl();
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [syncFromUrl]);

  const value = useMemo<AuthModalContextValue>(
    () => ({
      isOpen,
      callbackUrl,
      openAuthModal,
      closeAuthModal
    }),
    [callbackUrl, closeAuthModal, isOpen, openAuthModal]
  );

  return (
    <AuthModalContext.Provider value={value}>
      {children}
      <AuthModal open={isOpen} callbackUrl={callbackUrl} onClose={closeAuthModal} />
    </AuthModalContext.Provider>
  );
}

export function useAuthModal() {
  const context = useContext(AuthModalContext);
  if (!context) {
    throw new Error("useAuthModal must be used within AuthModalProvider");
  }
  return context;
}
