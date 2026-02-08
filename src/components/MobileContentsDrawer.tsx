"use client";

import { useState } from "react";

type Section = {
  id: string;
  label: string;
};

type Props = {
  sections: Section[];
  triggerLabel?: string;
  triggerClassName?: string;
  floating?: boolean;
};

export default function MobileContentsDrawer({
  sections,
  triggerLabel = "Contents",
  triggerClassName,
  floating = false
}: Props) {
  const [open, setOpen] = useState(false);

  const triggerClasses = floating
    ? "fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-sagar-saffron px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-sagar-soft lg:hidden"
    : `rounded-full border border-sagar-amber/30 bg-white px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-sagar-ink/60 ${triggerClassName ?? ""}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={triggerClasses}
      >
        {triggerLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close contents"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/40"
          />
          <div className="absolute bottom-0 left-0 right-0 max-h-[70vh] rounded-t-3xl bg-sagar-cream px-6 pb-8 pt-6 shadow-sagar-card">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">Contents</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-xs font-semibold uppercase tracking-[0.2em] text-sagar-ink/60"
              >
                Close
              </button>
            </div>
            <div className="mt-5 grid gap-3 text-sm text-sagar-ink/70">
              {sections.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-sagar-amber/20 bg-white/70 px-4 py-3"
                >
                  {section.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
