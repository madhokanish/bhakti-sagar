/**
 * Checkout copy, mirrored from the Android app's Strings.kt.
 *
 * People arrive here mid-tap from the app's चढ़ावा screen, so this page has to read as the
 * same screen rather than a different product. Wording is copied verbatim from the app
 * (chadhaava_* keys) — if it changes there, change it here too.
 *
 * "en" is the app's HINGLISH: Latin script keeping devotional words as they are, which is
 * what the app labels "English". See LanguageStore's note on why that is the honest label.
 */

export type CheckoutLang = "hi" | "en";

export function resolveCheckoutLang(raw: string | null | undefined): CheckoutLang {
  return raw === "hi" ? "hi" : "en";
}

type Copy = {
  priceNow: string;
  priceSub: string;
  refundTitle: string;
  refundSub: string;
  planPrice: string;
  cancelAnytime: string;
  benefitsTitle: string;
  benefits: { title: string; sub: string }[];
  ctaLine1: string;
  ctaLine2: string;
  subscribingAs: string;
  opening: string;
  reopen: string;
  /** Shown for the moment between Razorpay confirming and the app taking over. */
  verified: string;
};

export const CHADHAAVA_COPY: Record<CheckoutLang, Copy> = {
  en: {
    priceNow: "now",
    priceSub: "All BhaktiChat features free for 3 days",
    refundTitle: "₹5 back within minutes",
    refundSub: "₹5 comes back to the same UPI account",
    planPrice: "₹199/month after 3 days",
    cancelAnytime: "Cancel anytime",
    benefitsTitle: "What you get",
    benefits: [
      { title: "Talk like a phone call", sub: "Speak your question, hear the answer right away" },
      { title: "Unlimited conversations", sub: "With Krishna, Lakshmi, Shani and every guide" },
      { title: "Divine images", sub: "Create your photo with the deities" },
      { title: "Wallpapers and status", sub: "New wallpapers and status every day" },
      { title: "Ad-free experience", sub: "No interruptions" }
    ],
    ctaLine1: "Start Chadhava for ₹5",
    ctaLine2: "₹5 back right away • 3 days of BhaktiChat free",
    subscribingAs: "Subscribing as",
    opening: "Opening payment…",
    reopen: "Start Chadhava for ₹5",
    verified: "Chadhava accepted, head back to the app"
  },
  hi: {
    priceNow: "अभी",
    priceSub: "3 दिन तक BhaktiChat के सारे फ़ीचर बिलकुल फ़्री",
    refundTitle: "₹5 कुछ ही मिनट में वापस",
    refundSub: "₹5 उसी UPI अकाउंट में वापस आ जाएँगे",
    planPrice: "3 दिन बाद ₹199/महीना",
    cancelAnytime: "कभी भी कैंसल करें",
    benefitsTitle: "आपको क्या मिलेगा",
    benefits: [
      { title: "फ़ोन जैसी बातचीत", sub: "बोलकर पूछें, तुरंत आवाज़ में जवाब पाएँ" },
      { title: "असीमित बातचीत", sub: "कृष्ण, लक्ष्मी, शनि और सभी गुरुओं के साथ" },
      { title: "दिव्य तस्वीरें", sub: "भगवान के साथ अपनी फ़ोटो बनाएँ" },
      { title: "वॉलपेपर और स्टेटस", sub: "रोज़ नए वॉलपेपर और स्टेटस" },
      { title: "बिना ऐड्स का अनुभव", sub: "कोई रुकावट नहीं" }
    ],
    ctaLine1: "₹5 में चढ़ावा शुरू करें",
    ctaLine2: "₹5 तुरंत वापस • 3 दिन BhaktiChat फ़्री",
    subscribingAs: "सब्सक्राइब कर रहे हैं",
    opening: "पेमेंट खुल रहा है…",
    reopen: "₹5 में चढ़ावा शुरू करें",
    verified: "चढ़ावा स्वीकार हुआ, ऐप पर वापस जाएँ"
  }
};
