"use client";

import type { MembershipMode } from "@/app/online-puja/plans";

type Props = {
  mode: MembershipMode;
  onChange: (mode: MembershipMode) => void;
  sticky?: boolean;
};

export default function MembershipModeToggle({ mode, onChange, sticky = false }: Props) {
  return (
    <div
      className={[
        "rounded-2xl border border-sagar-amber/25 bg-white/90 p-1 shadow-sagar-soft backdrop-blur",
        sticky ? "sticky top-[calc(env(safe-area-inset-top)+4.75rem)] z-20 md:hidden" : ""
      ].join(" ")}
      role="tablist"
      aria-label="Choose booking mode"
    >
      <div className="grid grid-cols-2 gap-1">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "membership"}
          onClick={() => onChange("membership")}
          className={[
            "min-h-[42px] rounded-xl px-3 text-sm font-semibold transition",
            mode === "membership"
              ? "bg-sagar-saffron text-white"
              : "bg-transparent text-sagar-ink/75 hover:bg-sagar-cream"
          ].join(" ")}
        >
          Membership
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "once"}
          onClick={() => onChange("once")}
          className={[
            "min-h-[42px] rounded-xl px-3 text-sm font-semibold transition",
            mode === "once" ? "bg-sagar-saffron text-white" : "bg-transparent text-sagar-ink/75 hover:bg-sagar-cream"
          ].join(" ")}
        >
          Book once
        </button>
      </div>
    </div>
  );
}
