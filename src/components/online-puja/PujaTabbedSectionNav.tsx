"use client";

import { useMemo, useState } from "react";
import PujaBenefitCards from "@/components/online-puja/PujaBenefitCards";
import PujaProcessSteps from "@/components/online-puja/PujaProcessSteps";
import PujaTempleCard from "@/components/online-puja/PujaTempleCard";
import type { OnlinePuja, PujaTabKey } from "@/lib/onlinePuja";

const tabs: { key: PujaTabKey; label: string }[] = [
  { key: "about", label: "About" },
  { key: "benefits", label: "Benefits" },
  { key: "process", label: "Process" },
  { key: "temple", label: "Temple Details" }
];

type Props = {
  puja: OnlinePuja;
};

export default function PujaTabbedSectionNav({ puja }: Props) {
  const [activeTab, setActiveTab] = useState<PujaTabKey>("about");
  const active = useMemo(() => tabs.find((tab) => tab.key === activeTab) ?? tabs[0], [activeTab]);

  return (
    <section className="rounded-3xl border border-sagar-amber/20 bg-sagar-sand/60 p-4 sm:p-6" aria-label="Puja details">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Puja detail sections">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={tab.key === active.key}
            aria-controls={`puja-panel-${tab.key}`}
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] transition ${
              tab.key === active.key
                ? "bg-sagar-saffron text-white"
                : "border border-sagar-amber/30 bg-white text-sagar-ink/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div id={`puja-panel-${active.key}`} role="tabpanel" className="mt-5">
        {active.key === "about" && (
          <div className="space-y-3 text-sm leading-relaxed text-sagar-ink/80">
            {puja.sections.about.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>
        )}
        {active.key === "benefits" && <PujaBenefitCards benefits={puja.sections.benefits} />}
        {active.key === "process" && <PujaProcessSteps steps={puja.sections.process} />}
        {active.key === "temple" && (
          <PujaTempleCard
            templeName={puja.temple.name}
            city={puja.temple.city}
            state={puja.temple.state}
            details={puja.sections.temple}
          />
        )}
      </div>
    </section>
  );
}

