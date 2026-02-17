#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const filesToCheck = [
  "src/app/page.tsx",
  "src/app/online-puja/page.tsx",
  "src/app/online-puja/ganesh-weekly/page.tsx",
  "src/app/online-puja/shani-weekly/page.tsx",
  "src/app/subscribe/page.tsx",
  "src/app/online-puja/success/page.tsx",
  "src/components/PromoRibbon.tsx",
  "src/components/home/HomeWeeklyMembershipSection.tsx",
  "src/components/online-puja/PujaListingPage.tsx",
  "src/components/online-puja/MembershipPlanPage.tsx",
  "src/components/online-puja/ShaniWeeklyMembershipPage.tsx",
  "src/components/online-puja/HowItWorksSteps.tsx"
];

const disallowedPatterns = [
  { deity: "Ganesh", regex: /(?<!Lord )\bGanesh\b(?! Ji)/g },
  { deity: "Shani", regex: /\bShani\b(?! Dev)/g }
];

const findings = [];

for (const file of filesToCheck) {
  const absolutePath = path.resolve(process.cwd(), file);
  if (!fs.existsSync(absolutePath)) continue;
  const source = fs.readFileSync(absolutePath, "utf8");
  const lines = source.split(/\r?\n/);

  lines.forEach((line, index) => {
    for (const pattern of disallowedPatterns) {
      if (pattern.regex.test(line)) {
        findings.push({
          file,
          lineNumber: index + 1,
          deity: pattern.deity,
          line: line.trim()
        });
      }
      pattern.regex.lastIndex = 0;
    }
  });
}

if (findings.length > 0) {
  console.error("Found deity naming strings without honorifics:");
  for (const finding of findings) {
    console.error(
      `- ${finding.file}:${finding.lineNumber} (${finding.deity}) -> ${finding.line}`
    );
  }
  process.exit(1);
}

console.log("Deity naming check passed.");
