import type { ReactNode } from "react";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
};

export default function OnlinePujaLayout({ eyebrow, title, description, children }: Props) {
  return (
    <div className="container py-8 md:py-12">
      <div className="rounded-3xl border border-sagar-amber/20 bg-gradient-to-br from-sagar-sand to-white p-5 shadow-sagar-soft md:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{eyebrow}</p>
            <h1 className="mt-3 text-3xl font-serif text-sagar-ink md:text-4xl">{title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-relaxed text-sagar-ink/75 md:text-base">{description}</p>
          </div>
          <div className="hidden rounded-2xl border border-sagar-amber/30 bg-white/80 px-4 py-3 text-xs text-sagar-ink/70 md:block">
            <p className="font-semibold uppercase tracking-[0.18em] text-sagar-rose">Help and Support</p>
            <p className="mt-1">Email: support@bhakti-sagar.com</p>
          </div>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </div>
  );
}

