// One-off setup script: creates the ₹199/month Razorpay Plan used by the
// UPI AutoPay subscription flow. Run once per Razorpay account/mode
// (test vs live each need their own Plan). Plans cannot be edited or
// deleted afterwards, so double check the amount before running this.
//
// Usage: node scripts/create-razorpay-plan.js
// Reads RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET from the environment, or
// falls back to parsing them out of .env.local if present.

const fs = require("node:fs");
const path = require("node:path");
const Razorpay = require("razorpay");

function loadEnvLocalFallback() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  const contents = fs.readFileSync(envPath, "utf8");
  for (const line of contents.split("\n")) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key]) continue;
    process.env[key] = rawValue.trim().replace(/^"(.*)"$/, "$1");
  }
}

async function main() {
  loadEnvLocalFallback();

  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET are not set (checked env and .env.local).");
  }

  const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });

  const plan = await razorpay.plans.create({
    period: "monthly",
    interval: 1,
    item: {
      name: "BhaktiChat Membership",
      amount: 19900,
      currency: "INR",
      description: "BhaktiChat monthly membership via UPI AutoPay"
    }
  });

  console.log("Plan created:");
  console.log(plan);
  console.log("\nAdd this to your env as RAZORPAY_PLAN_ID_MONTHLY:");
  console.log(plan.id);
}

main().catch((error) => {
  console.error("Failed to create Razorpay plan:", error?.error?.description || error);
  process.exit(1);
});
