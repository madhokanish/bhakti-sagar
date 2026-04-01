"use client";

import AartiCard from "@/components/AartiCard";
import LanguageToggle from "@/components/LanguageToggle";
import { AARTIS_COPY } from "@/lib/aartisCopy";
import type { HomeLang } from "@/lib/homeCopy";
import { useBhaktiLang, useHinglishNoindex } from "@/lib/useBhaktiLang";
import type { Aarti } from "@/lib/data";

type Props = {
  results: Aarti[];
  query: string;
  routeLocale: "en" | "hi";
  formAction: string;
};

export default function LocalizedAartisContent({ results, query, routeLocale, formAction }: Props) {
  const initialLang: HomeLang = routeLocale === "hi" ? "hi" : "en";
  const { lang, setLang } = useBhaktiLang(initialLang);
  const effectiveLang: HomeLang = routeLocale === "hi" ? "hi" : lang === "hinglish" ? "hinglish" : "en";
  const copy = AARTIS_COPY[effectiveLang];

  useHinglishNoindex(effectiveLang);

  return (
    <div className={`container py-12 ${effectiveLang === "hi" ? "[font-family:Noto_Sans_Devanagari,var(--font-body),sans-serif]" : ""}`}>
      <div className="mb-4 flex justify-end md:hidden">
        <LanguageToggle currentLang={effectiveLang} onChange={setLang} compact />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{copy.section_kicker}</p>
          <h1 className="mt-2 text-3xl font-serif text-sagar-ink">{copy.h1}</h1>
          <p className="mt-2 text-sm text-sagar-ink/70">
            {results.length} {copy.count_suffix}
          </p>
        </div>
        <form
          action={formAction}
          className="flex w-full max-w-md items-center gap-2 rounded-full border border-sagar-amber/30 bg-white px-4 py-2 shadow-sagar-soft"
        >
          <label htmlFor="aartis-search" className="sr-only">
            {copy.search_label}
          </label>
          <input
            id="aartis-search"
            name="q"
            defaultValue={query}
            placeholder={copy.search_placeholder}
            className="w-full bg-transparent text-sm outline-none placeholder:text-sagar-ink/50"
          />
          <button className="rounded-full bg-sagar-saffron px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white">
            {copy.search_label}
          </button>
        </form>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {results.map((aarti) => (
          <AartiCard key={aarti.id} aarti={aarti} language="en" />
        ))}
      </div>
    </div>
  );
}
