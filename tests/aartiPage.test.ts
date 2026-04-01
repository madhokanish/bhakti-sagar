import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const pagePath = path.join(process.cwd(), "src/app/aartis/[slug]/page.tsx");

test("aarti page renders AI and video sections only once", () => {
  const source = fs.readFileSync(pagePath, "utf8");
  const meaningCount = (source.match(/<MeaningPanel/g) || []).length;
  const iframeCount = (source.match(/<iframe/g) || []).length;
  assert.equal(meaningCount, 1);
  assert.equal(iframeCount, 1);
});

