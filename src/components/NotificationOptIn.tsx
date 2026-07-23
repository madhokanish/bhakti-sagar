"use client";

// TODO: Real push delivery requires a service-worker (e.g. /service-worker.js)
// registering a PushManager subscription with a VAPID public key, plus a backend
// endpoint that stores the subscription and sends Web Push messages.

import { useEffect, useState } from "react";

type PermissionState = NotificationPermission | "unsupported";
const OPT_IN_KEY = "bhakti_notify_optin";

export default function NotificationOptIn() {
  const [permission, setPermission] = useState<PermissionState>("default");
  const [optedIn, setOptedIn] = useState(false);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
    try {
      setOptedIn(window.localStorage.getItem(OPT_IN_KEY) === "1");
    } catch {
      // ignore
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    setRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === "granted") {
        try {
          window.localStorage.setItem(OPT_IN_KEY, "1");
          setOptedIn(true);
        } catch {
          // ignore
        }
      }
    } finally {
      setRequesting(false);
    }
  };

  const toggleOptIn = () => {
    try {
      const next = !optedIn;
      window.localStorage.setItem(OPT_IN_KEY, next ? "1" : "0");
      setOptedIn(next);
    } catch {
      // ignore
    }
  };

  if (permission === "unsupported") {
    return (
      <div className="rounded-2xl border border-sagar-amber/25 bg-sagar-cream/40 p-4 text-sm text-sagar-ink/70">
        Notifications are not supported in this browser.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-sagar-amber/25 bg-white p-4 shadow-[0_10px_30px_-26px_rgba(46,22,10,0.5)]">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-sagar-ink/60">Notifications</p>
      <h3 className="mt-1 text-base font-semibold text-sagar-ink">Daily darshan & reminders</h3>
      <p className="mt-1 text-sm text-sagar-ink/70">
        Get gentle reminders for aartis, festivals, and choghadiya windows.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        {permission === "default" ? (
          <button
            type="button"
            onClick={() => void requestPermission()}
            disabled={requesting}
            className="rounded-full border border-sagar-amber/40 bg-sagar-saffron px-4 py-2 text-xs font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {requesting ? "Requesting…" : "Enable notifications"}
          </button>
        ) : permission === "granted" ? (
          <>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Permission granted
            </span>
            <button
              type="button"
              onClick={toggleOptIn}
              className="rounded-full border border-sagar-amber/30 px-3 py-1 text-xs font-semibold text-sagar-ink/75 hover:text-sagar-ember"
              aria-pressed={optedIn}
            >
              {optedIn ? "Disable reminders" : "Enable reminders"}
            </button>
          </>
        ) : (
          <span className="rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            Permission denied — update in browser settings
          </span>
        )}
      </div>
    </div>
  );
}
