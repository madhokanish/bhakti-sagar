export type EventParams = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    gtag?: (command: "event", eventName: string, params?: EventParams) => void;
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(eventName: string, params: EventParams = {}) {
  if (typeof window === "undefined") return;

  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, params);
  }

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push({ event: eventName, ...params });
  }
}
