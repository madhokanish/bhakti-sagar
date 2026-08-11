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
    priceNow: "abhi",
    priceSub: "3 din tak BhaktiChat ke saare features bilkul free",
    refundTitle: "₹5 kuch hi minute mein wapas",
    refundSub: "₹5 usi UPI account mein wapas aa jayenge",
    planPrice: "3 din baad ₹199/mahina",
    cancelAnytime: "Kabhi bhi cancel karein",
    benefitsTitle: "Aapko kya milega",
    benefits: [
      { title: "Phone jaisi baatcheet", sub: "Bol kar poochein, turant awaaz mein jawab paayein" },
      { title: "Aseemit baatcheet", sub: "Krishna, Lakshmi, Shani aur sabhi guruon ke saath" },
      { title: "Divya tasveerein", sub: "Bhagwan ke saath apni photo banayein" },
      { title: "Wallpaper aur status", sub: "Roz naye wallpaper aur status" },
      { title: "Bina ads ka experience", sub: "Koi rukawat nahi" }
    ],
    ctaLine1: "₹5 mein Chadhawa shuru karein",
    ctaLine2: "₹5 turant wapas • 3 din BhaktiChat free",
    subscribingAs: "Subscribing as",
    opening: "Payment khul raha hai…",
    reopen: "₹5 mein Chadhawa shuru karein",
    verified: "Chadhava sweekar hua — app par wapas jaayein"
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
    verified: "चढ़ावा स्वीकार हुआ — ऐप पर वापस जाएँ"
  }
};
