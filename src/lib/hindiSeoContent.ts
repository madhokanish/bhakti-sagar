import { HI_KEYWORD_MAP } from "@/lib/hiKeywordMap";

export type Locale = "en" | "hi";
export type DeitySlug = "krishna" | "lakshmi" | "shani";
export type KrishnaTopicSlug = "mantra" | "aarti" | "chalisa" | "bhajan" | "gita-shlok";
export type LakshmiTopicSlug = "mantra" | "aarti" | "chalisa" | "puja-vidhi" | "katha";
export type ShaniTopicSlug = "mantra" | "aarti" | "chalisa" | "vrat-katha" | "puja-vidhi";
export type TopicSlug = KrishnaTopicSlug | LakshmiTopicSlug | ShaniTopicSlug;

export type LocalizedText = {
  en: string;
  hi: string;
};

type LocalizedFaq = {
  en: { q: string; a: string }[];
  hi: { q: string; a: string }[];
};

type HubContent = {
  deity: DeitySlug;
  slug: string;
  h1: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  introParagraphs: LocalizedText[];
  forWhom: LocalizedText[];
  askToday: LocalizedText[];
  mantraAndAartiLinks: Array<{ href: string; label: LocalizedText }>;
  faqs: LocalizedFaq;
  ctaLabel: LocalizedText;
};

type TopicContent = {
  deity: DeitySlug;
  topic: TopicSlug;
  slug: string;
  h1: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  intro: LocalizedText;
  sections: Array<{
    heading: LocalizedText;
    paragraphs: LocalizedText[];
  }>;
  howToHeading: LocalizedText;
  howToSteps: LocalizedText[];
  disclaimer?: LocalizedText;
  faqs: LocalizedFaq;
  publishedAt: string;
  updatedAt: string;
};

export const DEITY_DISPLAY_NAME: Record<DeitySlug, LocalizedText> = {
  krishna: { en: "Shri Krishna", hi: "श्री कृष्ण" },
  lakshmi: { en: "Lakshmi Ji", hi: "लक्ष्मी जी" },
  shani: { en: "Shani Dev", hi: "शनि देव" }
};

export const DEITY_CHAT_GUIDE: Record<DeitySlug, string> = {
  krishna: "krishna",
  lakshmi: "lakshmi",
  shani: "shani"
};

export const HUB_CONTENT: Record<DeitySlug, HubContent> = {
  krishna: {
    deity: "krishna",
    slug: "krishna",
    h1: {
      en: "Shri Krishna guidance in simple language",
      hi: "श्री कृष्ण से बात करें और सरल मार्गदर्शन पाएँ"
    },
    title: {
      en: "Talk to Shri Krishna | Guidance, Mantra, Aarti",
      hi: "श्री कृष्ण से बात करें | मंत्र, आरती और मार्गदर्शन"
    },
    description: {
      en: "Ask Shri Krishna for Gita-inspired guidance, daily clarity, and devotional practice in simple language.",
      hi: "श्री कृष्ण से सरल हिंदी में मार्गदर्शन पाएँ। गीता के उपदेश, मंत्र, आरती और जीवन के फैसलों में स्पष्ट दिशा पाएँ।"
    },
    introParagraphs: [
      {
        en: "When the mind is restless, most people do not need heavy philosophy. They need one clear direction and a calm way to move. This Krishna hub is made for that daily need.",
        hi: "जब मन उलझा होता है, तब भारी भाषा नहीं, साफ दिशा चाहिए होती है। यह श्री कृष्ण हब उसी रोज़मर्रा की जरूरत के लिए बनाया गया है, ताकि मन शांत हो और अगला कदम समझ आए।"
      },
      {
        en: "You can ask about decisions, stress, guilt, discipline, relationships, and duties. The tone is devotional, practical, and respectful. Advice is rooted in Gita values but explained in everyday words.",
        hi: "आप जीवन के फैसलों, तनाव, अपराधबोध, अनुशासन, रिश्तों और जिम्मेदारियों पर सवाल पूछ सकते हैं। जवाब भक्तिभाव से, सम्मानजनक तरीके से और बिल्कुल आसान भाषा में दिए जाते हैं। गीता की सीख रहती है, पर शब्द रोज़मर्रा के होते हैं।"
      },
      {
        en: "Along with chat, you get focused pages for Krishna mantra, Krishna aarti, Krishna chalisa, Krishna bhajan, and Gita verses. This cluster helps both seekers and regular devotees build a consistent practice.",
        hi: "चैट के साथ आपको कृष्ण मंत्र, कृष्ण आरती, कृष्ण चालीसा, कृष्ण भजन और गीता श्लोक के अलग पेज मिलते हैं। इससे नए साधक और नियमित भक्त, दोनों अपनी साधना को स्थिर और सरल बना सकते हैं।"
      },
      {
        en: "If you want to begin quickly, ask one honest question, read one short prayer, and take one small action before the day ends. Over time, this creates both devotion and inner steadiness.",
        hi: "अगर शुरुआत करनी है, तो एक सच्चा सवाल पूछें, एक छोटा पाठ करें और दिन खत्म होने से पहले एक छोटा सही कदम लें। यही छोटी निरंतरता धीरे-धीरे भक्ति के साथ मन की स्थिरता भी बनाती है।"
      }
    ],
    forWhom: [
      {
        en: "For people facing confusion in personal or professional decisions.",
        hi: "उन लोगों के लिए जो जीवन या करियर के फैसलों में उलझन महसूस कर रहे हैं।"
      },
      {
        en: "For devotees who want Krishna mantra and aarti with practical meaning.",
        hi: "उन भक्तों के लिए जो कृष्ण मंत्र और आरती को अर्थ सहित समझना चाहते हैं।"
      },
      {
        en: "For anyone who wants calm discipline without fear-based language.",
        hi: "उन सभी के लिए जो डर नहीं, बल्कि शांत अनुशासन के साथ आगे बढ़ना चाहते हैं।"
      }
    ],
    askToday: [
      {
        en: "What one decision am I avoiding right now?",
        hi: "मैं अभी कौन सा फैसला टाल रहा हूँ?"
      },
      {
        en: "How can I stay calm while doing my duty?",
        hi: "कर्तव्य निभाते हुए मैं मन को शांत कैसे रखूँ?"
      },
      {
        en: "Which Krishna mantra can I start with today?",
        hi: "आज से शुरू करने के लिए कौन सा कृष्ण मंत्र ठीक रहेगा?"
      }
    ],
    mantraAndAartiLinks: [
      { href: "/krishna/mantra", label: { en: "Krishna Mantra", hi: "श्री कृष्ण मंत्र" } },
      { href: "/krishna/aarti", label: { en: "Krishna Aarti", hi: "कृष्ण आरती" } },
      { href: "/krishna/gita-shlok", label: { en: "Gita Verses", hi: "भगवद गीता के श्लोक" } }
    ],
    faqs: {
      en: [
        { q: "Can I ask personal decision questions here?", a: "Yes. Ask directly and you will get short, respectful guidance." },
        { q: "Is this only for religious users?", a: "No. It is useful for anyone seeking calm and ethical clarity." },
        { q: "Do I need Sanskrit knowledge?", a: "No. Everything is explained in simple language." },
        { q: "Can I read mantra and aarti with meanings?", a: "Yes. Linked pages provide focused devotional reading." }
      ],
      hi: [
        { q: "क्या मैं निजी जीवन के फैसलों पर सवाल पूछ सकता हूँ?", a: "हाँ, आप सीधे सवाल पूछ सकते हैं और आपको छोटा, सम्मानजनक मार्गदर्शन मिलेगा।" },
        { q: "क्या यह सिर्फ धार्मिक लोगों के लिए है?", a: "नहीं, यह किसी भी व्यक्ति के लिए उपयोगी है जो शांत और सही दिशा चाहता है।" },
        { q: "क्या संस्कृत आना जरूरी है?", a: "नहीं, यहाँ सब कुछ आसान हिंदी में समझाया गया है।" },
        { q: "क्या मंत्र और आरती अर्थ सहित मिलेंगे?", a: "हाँ, जुड़े हुए पेज पर मंत्र, आरती और उनका सरल अर्थ उपलब्ध है।" }
      ]
    },
    ctaLabel: {
      en: "Start Krishna chat",
      hi: "श्री कृष्ण से अभी बात करें"
    }
  },
  lakshmi: {
    deity: "lakshmi",
    slug: "lakshmi",
    h1: {
      en: "Lakshmi Ji guidance for money calm and steady growth",
      hi: "लक्ष्मी जी से बात करें और समृद्धि की सही दिशा पाएँ"
    },
    title: {
      en: "Talk to Lakshmi Ji | Prosperity and stability guidance",
      hi: "लक्ष्मी जी से बात करें | समृद्धि, संतुलन और स्थिरता"
    },
    description: {
      en: "Get practical Lakshmi-inspired guidance for money stress, gratitude, disciplined growth, mantra, and puja practice.",
      hi: "लक्ष्मी जी से सरल हिंदी में मार्गदर्शन पाएँ। धन तनाव, स्थिर बढ़त, कृतज्ञता, मंत्र और पूजा विधि को आसान तरीके से समझें।"
    },
    introParagraphs: [
      {
        en: "Prosperity is not only about income. It is also about peace at home, stable habits, and the dignity of right effort. This Lakshmi Ji hub is designed around that broader view of abundance.",
        hi: "समृद्धि सिर्फ कमाई का नाम नहीं है। इसमें घर की शांति, सही आदतें और सम्मानजनक मेहनत भी शामिल है। यह लक्ष्मी जी हब उसी संतुलित दृष्टि के साथ बनाया गया है।"
      },
      {
        en: "If money anxiety, irregular planning, or overthinking is affecting your day, start with a simple question and one practical step. Guidance here stays devotional, grounded, and action-friendly.",
        hi: "अगर पैसों की चिंता, अस्थिर योजना या लगातार तनाव दिन को प्रभावित कर रहा है, तो एक साफ सवाल और एक छोटा व्यावहारिक कदम से शुरुआत करें। यहाँ जवाब भक्तिभाव के साथ जमीन से जुड़े हुए और काम के होते हैं।"
      },
      {
        en: "You can explore Lakshmi mantra, Lakshmi aarti, Lakshmi chalisa, Lakshmi puja vidhi, and Lakshmi katha pages for deeper daily practice. Each page is written in clear language, without complexity.",
        hi: "आप लक्ष्मी मंत्र, लक्ष्मी आरती, लक्ष्मी चालीसा, लक्ष्मी पूजा विधि और लक्ष्मी कथा वाले पेज भी देख सकते हैं। हर पेज आसान भाषा में लिखा गया है ताकि पढ़ना और पालन करना सरल लगे।"
      },
      {
        en: "A good daily loop is simple: gratitude, one disciplined money action, and one devotional moment. This builds long-term steadiness better than quick-fix thinking.",
        hi: "रोज़ का अच्छा क्रम बहुत सरल है: कृतज्ञता, पैसों से जुड़ा एक अनुशासित कदम, और एक छोटा भक्तिमय समय। तेज़ उपायों से ज़्यादा, यही आदत लंबे समय में स्थिरता और भरोसा बनाती है।"
      }
    ],
    forWhom: [
      {
        en: "For people feeling money stress and needing practical direction.",
        hi: "उन लोगों के लिए जो धन तनाव में हैं और व्यावहारिक दिशा चाहते हैं।"
      },
      {
        en: "For families seeking peace, balance, and gratitude routines.",
        hi: "उन परिवारों के लिए जो घर में शांति, संतुलन और कृतज्ञता का अभ्यास चाहते हैं।"
      },
      {
        en: "For devotees building consistent Lakshmi mantra and puja discipline.",
        hi: "उन भक्तों के लिए जो लक्ष्मी मंत्र और पूजा में नियमितता बनाना चाहते हैं।"
      }
    ],
    askToday: [
      {
        en: "Where is my money stress coming from this week?",
        hi: "इस सप्ताह मेरी धन चिंता का मुख्य कारण क्या है?"
      },
      {
        en: "What one expense habit should I fix first?",
        hi: "मुझे सबसे पहले कौन सी खर्च आदत सुधारनी चाहिए?"
      },
      {
        en: "Which Lakshmi practice can I do daily for 10 minutes?",
        hi: "लक्ष्मी जी की कौन सी साधना मैं रोज़ 10 मिनट कर सकता हूँ?"
      }
    ],
    mantraAndAartiLinks: [
      { href: "/lakshmi/mantra", label: { en: "Lakshmi Mantra", hi: "लक्ष्मी मंत्र" } },
      { href: "/lakshmi/aarti", label: { en: "Lakshmi Aarti", hi: "लक्ष्मी आरती" } },
      { href: "/lakshmi/puja-vidhi", label: { en: "Lakshmi Puja Vidhi", hi: "लक्ष्मी पूजा विधि" } }
    ],
    faqs: {
      en: [
        { q: "Can this help with money anxiety?", a: "Yes. It offers calm, practical steps and devotional support." },
        { q: "Does Lakshmi guidance mean only wealth tips?", a: "No. It includes gratitude, dignity, home balance, and right livelihood." },
        { q: "Can beginners use mantra pages?", a: "Yes. Mantra pages are written for beginners in simple language." },
        { q: "Is this financial advice?", a: "No. It is devotional guidance, not professional financial advice." }
      ],
      hi: [
        { q: "क्या यह धन चिंता में मदद कर सकता है?", a: "हाँ, यहाँ शांत और व्यावहारिक कदम दिए जाते हैं, साथ में भक्तिमय सहारा भी मिलता है।" },
        { q: "क्या लक्ष्मी मार्गदर्शन सिर्फ पैसे कमाने के लिए है?", a: "नहीं, इसमें कृतज्ञता, सम्मान, घर का संतुलन और सही जीवन पथ भी शामिल है।" },
        { q: "क्या शुरुआती लोग भी मंत्र पेज समझ सकते हैं?", a: "हाँ, मंत्र पेज बिल्कुल सरल भाषा में लिखे गए हैं।" },
        { q: "क्या यह वित्तीय सलाह है?", a: "नहीं, यह भक्तिमय मार्गदर्शन है, पेशेवर वित्तीय सलाह नहीं।" }
      ]
    },
    ctaLabel: {
      en: "Start Lakshmi chat",
      hi: "लक्ष्मी जी से अभी बात करें"
    }
  },
  shani: {
    deity: "shani",
    slug: "shani",
    h1: {
      en: "Shani Dev guidance for discipline during difficult phases",
      hi: "शनि देव से बात करें और कठिन समय में सही दिशा पाएँ"
    },
    title: {
      en: "Talk to Shani Dev | Discipline, patience, and steadiness",
      hi: "शनि देव से बात करें | अनुशासन, धैर्य और स्थिरता"
    },
    description: {
      en: "Read simple guidance on Shani mantra, Shani aarti, Shani chalisa, vrat katha, and disciplined daily action.",
      hi: "शनि देव से सरल हिंदी में मार्गदर्शन पाएँ। शनि मंत्र, शनि आरती, शनि चालीसा, शनिवार व्रत कथा और पूजा विधि को साफ तरीके से समझें।"
    },
    introParagraphs: [
      {
        en: "Hard phases often feel heavy because we lose rhythm and clarity together. This Shani Dev hub is built to restore steady action with calm discipline, not fear.",
        hi: "मुश्किल समय इसलिए भी भारी लगता है क्योंकि हमारी लय और स्पष्टता दोनों टूट जाती हैं। यह शनि देव हब डर नहीं, बल्कि शांत अनुशासन के साथ स्थिर कदम वापस लाने के लिए बनाया गया है।"
      },
      {
        en: "You can ask about setbacks, delays, self-doubt, guilt, and repeated mistakes. Responses focus on responsibility and practical correction in respectful language.",
        hi: "आप रुकावट, देरी, आत्म-संदेह, अपराधबोध और बार-बार होने वाली गलतियों पर सवाल पूछ सकते हैं। जवाब सम्मानजनक भाषा में जिम्मेदारी और व्यावहारिक सुधार पर केंद्रित रहते हैं।"
      },
      {
        en: "To support long-tail searches and real practice, this section also links Shani mantra, Shani aarti, Shani chalisa, Shani vrat katha, and Shani puja vidhi pages.",
        hi: "सिर्फ चैट नहीं, बल्कि अभ्यास के लिए आपको शनि मंत्र, शनि आरती, शनि चालीसा, शनिवार व्रत कथा और शनि पूजा विधि के अलग पेज भी मिलते हैं। इससे साधना और समझ दोनों गहरी होती हैं।"
      },
      {
        en: "A simple formula works best: accept reality, do one disciplined task today, and keep your devotional routine small but regular. This creates strength without panic.",
        hi: "एक सरल सूत्र सबसे अच्छा काम करता है: स्थिति को मानें, आज एक अनुशासित काम पूरा करें, और छोटी लेकिन नियमित साधना बनाए रखें। इससे घबराहट नहीं, बल्कि अंदर से शक्ति बनती है।"
      }
    ],
    forWhom: [
      {
        en: "For people in setbacks, delays, and high pressure phases.",
        hi: "उन लोगों के लिए जो रुकावट, देरी और दबाव के दौर से गुजर रहे हैं।"
      },
      {
        en: "For devotees who want Shani worship in clear, practical language.",
        hi: "उन भक्तों के लिए जो शनि साधना को सरल और स्पष्ट भाषा में समझना चाहते हैं।"
      },
      {
        en: "For anyone who wants accountability without harshness.",
        hi: "उन लोगों के लिए जो कठोरता नहीं, पर जिम्मेदारी के साथ आगे बढ़ना चाहते हैं।"
      }
    ],
    askToday: [
      {
        en: "What one task have I been postponing for too long?",
        hi: "मैं कौन सा जरूरी काम बहुत समय से टाल रहा हूँ?"
      },
      {
        en: "How can I rebuild discipline this week?",
        hi: "इस सप्ताह मैं अनुशासन को फिर से कैसे शुरू करूँ?"
      },
      {
        en: "Which Shani practice can I do regularly on Saturdays?",
        hi: "शनिवार को मैं शनि देव की कौन सी साधना नियमित कर सकता हूँ?"
      }
    ],
    mantraAndAartiLinks: [
      { href: "/shani/mantra", label: { en: "Shani Mantra", hi: "शनि मंत्र" } },
      { href: "/shani/aarti", label: { en: "Shani Aarti", hi: "शनि आरती" } },
      { href: "/shani/vrat-katha", label: { en: "Shani Vrat Katha", hi: "शनिवार व्रत कथा" } }
    ],
    faqs: {
      en: [
        { q: "Can I ask about Sade Sati fears?", a: "Yes. You can ask and receive practical, calm guidance." },
        { q: "Do I get ritual steps too?", a: "Yes. Topic pages include simple, devotional how-to sections." },
        { q: "Is this fear-based astrology advice?", a: "No. It focuses on discipline and responsibility." },
        { q: "Can beginners read these pages?", a: "Yes. Language is simple and beginner-friendly." }
      ],
      hi: [
        { q: "क्या मैं साढ़ेसाती के डर पर सवाल पूछ सकता हूँ?", a: "हाँ, आपको शांत और व्यावहारिक मार्गदर्शन मिलेगा।" },
        { q: "क्या पूजा के आसान स्टेप्स भी मिलते हैं?", a: "हाँ, विषय पेज पर सरल तरीके से कैसे करें सेक्शन दिया गया है।" },
        { q: "क्या यह डर फैलाने वाला ज्योतिष कंटेंट है?", a: "नहीं, यहाँ ध्यान अनुशासन, जिम्मेदारी और स्थिरता पर है।" },
        { q: "क्या शुरुआती लोग भी इन पेजों को समझ पाएँगे?", a: "हाँ, भाषा सरल और रोज़मर्रा की रखी गई है।" }
      ]
    },
    ctaLabel: {
      en: "Start Shani chat",
      hi: "शनि देव से अभी बात करें"
    }
  }
};

const topicContentList: TopicContent[] = [
  {
    deity: "krishna",
    topic: "mantra",
    slug: "/krishna/mantra",
    h1: { en: "Shri Krishna mantra with simple meaning", hi: "श्री कृष्ण मंत्र और सरल अर्थ" },
    title: { en: "Shri Krishna Mantra | Simple chant and meaning", hi: "श्री कृष्ण मंत्र | सरल मंत्र और अर्थ" },
    description: {
      en: "Read Shri Krishna mantra, learn easy chanting method, and understand meaning in simple language.",
      hi: "श्री कृष्ण मंत्र, जप का सही तरीका और आसान अर्थ। भक्ति और मन की शांति के लिए पढ़ें।"
    },
    intro: {
      en: "Shri Krishna mantra helps center the mind before action.",
      hi: "श्री कृष्ण मंत्र मन को स्थिर करके सही दिशा में चलने की शक्ति देता है।"
    },
    sections: [
      {
        heading: { en: "Popular mantra", hi: "लोकप्रिय मंत्र" },
        paragraphs: [
          {
            en: "A simple and commonly recited mantra is: " +
              "ॐ नमो भगवते वासुदेवाय. Recite with calm breath and clear attention.",
            hi: "सबसे प्रचलित और सरल मंत्र है: ॐ नमो भगवते वासुदेवाय। इसे धीमे, साफ उच्चारण और शांत मन से जपें।"
          },
          {
            en: "You do not need long rituals to begin. Consistency matters more than duration.",
            hi: "शुरुआत के लिए लंबी विधि जरूरी नहीं है। नियमितता समय से ज़्यादा महत्वपूर्ण है।"
          }
        ]
      },
      {
        heading: { en: "Meaning", hi: "सरल अर्थ" },
        paragraphs: [
          {
            en: "This mantra is a surrender to the divine wisdom of Krishna and a reminder to act with clarity.",
            hi: "यह मंत्र श्री कृष्ण की दिव्य बुद्धि में समर्पण और जीवन में स्पष्ट निर्णय लेने की याद दिलाता है।"
          }
        ]
      }
    ],
    howToHeading: { en: "How to practice", hi: "कैसे करें" },
    howToSteps: [
      { en: "Sit quietly for 5 minutes.", hi: "5 मिनट शांत बैठें।" },
      { en: "Repeat the mantra 11 or 21 times.", hi: "मंत्र को 11 या 21 बार जपें।" },
      { en: "End by noting one action for the day.", hi: "अंत में आज का एक सही कदम तय करें।" }
    ],
    faqs: {
      en: [
        { q: "How many times should I chant?", a: "Start with 11 or 21 repetitions daily." },
        { q: "Can I chant without mala?", a: "Yes, mala is optional for beginners." },
        { q: "Best time to chant?", a: "Morning is ideal, but consistency matters most." },
        { q: "Can students chant this mantra?", a: "Yes, it is suitable for all devotees." }
      ],
      hi: [
        { q: "मंत्र कितनी बार जपना चाहिए?", a: "शुरुआत 11 या 21 बार से करें।" },
        { q: "क्या बिना माला के जप सकते हैं?", a: "हाँ, शुरुआती लोग बिना माला भी जप सकते हैं।" },
        { q: "जप का सही समय क्या है?", a: "सुबह अच्छा समय है, लेकिन नियमितता सबसे जरूरी है।" },
        { q: "क्या विद्यार्थी भी यह मंत्र जप सकते हैं?", a: "हाँ, यह मंत्र सभी के लिए उपयुक्त है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "krishna",
    topic: "aarti",
    slug: "/krishna/aarti",
    h1: { en: "Krishna Aarti with easy recitation guide", hi: "कृष्ण आरती और सरल पाठ मार्गदर्शन" },
    title: { en: "Krishna Aarti | Lyrics and simple way", hi: "कृष्ण आरती | बोल और आसान तरीका" },
    description: {
      en: "Read Krishna Aarti, understand when to recite, and follow a short devotional routine.",
      hi: "कृष्ण आरती के बोल, पाठ का सही समय और घर पर करने का आसान तरीका पढ़ें।"
    },
    intro: {
      en: "Krishna Aarti is a simple daily devotional practice for gratitude and steadiness.",
      hi: "कृष्ण आरती दैनिक भक्ति का सरल अभ्यास है, जो कृतज्ञता और मन की स्थिरता बढ़ाता है।"
    },
    sections: [
      {
        heading: { en: "When to recite", hi: "कब करें" },
        paragraphs: [
          { en: "Morning or evening both work. Keep a fixed time when possible.", hi: "सुबह या शाम, दोनों समय ठीक हैं। संभव हो तो रोज़ एक ही समय रखें।" }
        ]
      },
      {
        heading: { en: "What you need", hi: "क्या रखें" },
        paragraphs: [
          { en: "A diya, clean space, and focused attention are enough for beginners.", hi: "एक दीपक, स्वच्छ स्थान और एकाग्र मन शुरुआती साधना के लिए पर्याप्त हैं।" }
        ]
      }
    ],
    howToHeading: { en: "How to do", hi: "कैसे करें" },
    howToSteps: [
      { en: "Light a diya and sit for one minute in silence.", hi: "दीपक जलाकर एक मिनट शांत बैठें।" },
      { en: "Read Krishna Aarti slowly with clear pronunciation.", hi: "कृष्ण आरती को स्पष्ट उच्चारण के साथ धीरे पढ़ें।" },
      { en: "Close with gratitude and one good action intention.", hi: "अंत में कृतज्ञता व्यक्त करें और एक अच्छा काम तय करें।" }
    ],
    faqs: {
      en: [
        { q: "Can I do Krishna Aarti at home daily?", a: "Yes, a short daily practice is ideal." },
        { q: "Is full ritual required?", a: "No, a simple sincere practice is enough." },
        { q: "Can children join?", a: "Yes, family participation is encouraged." },
        { q: "Can I read from phone?", a: "Yes, if done respectfully and attentively." }
      ],
      hi: [
        { q: "क्या कृष्ण आरती रोज़ घर पर कर सकते हैं?", a: "हाँ, रोज़ की छोटी साधना बहुत अच्छी रहती है।" },
        { q: "क्या पूरी विधि जरूरी है?", a: "नहीं, सच्चे मन से सरल आरती भी पर्याप्त है।" },
        { q: "क्या बच्चे भी आरती में शामिल हो सकते हैं?", a: "हाँ, परिवार के साथ आरती करना बहुत शुभ माना जाता है।" },
        { q: "क्या मोबाइल से आरती पढ़ सकते हैं?", a: "हाँ, श्रद्धा और ध्यान के साथ पढ़ सकते हैं।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "krishna",
    topic: "chalisa",
    slug: "/krishna/chalisa",
    h1: { en: "Krishna Chalisa in simple language", hi: "कृष्ण चालीसा सरल भाषा में" },
    title: { en: "Krishna Chalisa | Easy reading and focus", hi: "कृष्ण चालीसा | सरल पाठ और अर्थ" },
    description: { en: "Understand Krishna Chalisa recitation with simple routine and devotional meaning.", hi: "कृष्ण चालीसा का सरल पाठ, अर्थ और रोज़मर्रा में अपनाने का आसान तरीका जानें।" },
    intro: { en: "Krishna Chalisa is recited for devotion, emotional balance, and inner confidence.", hi: "कृष्ण चालीसा भक्ति, भावनात्मक संतुलन और भीतर के आत्मविश्वास के लिए पढ़ी जाती है।" },
    sections: [
      { heading: { en: "Why recite", hi: "क्यों पढ़ें" }, paragraphs: [{ en: "It helps align the mind with devotion and positive action.", hi: "यह मन को भक्ति और सकारात्मक कर्म की दिशा में स्थिर करती है।" }] },
      { heading: { en: "Reading pace", hi: "पाठ की गति" }, paragraphs: [{ en: "Read at a steady pace; clarity is better than speed.", hi: "पाठ को स्थिर गति से पढ़ें; तेज़ी से अधिक स्पष्टता महत्वपूर्ण है।" }] }
    ],
    howToHeading: { en: "How to read", hi: "कैसे पढ़ें" },
    howToSteps: [
      { en: "Start with a short prayer.", hi: "छोटी प्रार्थना से शुरुआत करें।" },
      { en: "Read Chalisa once with attention.", hi: "चालीसा एक बार ध्यान से पढ़ें।" },
      { en: "Sit quietly for one minute after completion.", hi: "पूरा होने के बाद एक मिनट शांत बैठें।" }
    ],
    faqs: {
      en: [
        { q: "Can I read Krishna Chalisa daily?", a: "Yes, even once daily is beneficial." },
        { q: "Morning or evening?", a: "Both are fine if done regularly." },
        { q: "Can I combine with mantra?", a: "Yes, mantra before Chalisa works well." },
        { q: "Do I need fasting?", a: "No, fasting is optional." }
      ],
      hi: [
        { q: "क्या कृष्ण चालीसा रोज़ पढ़ सकते हैं?", a: "हाँ, रोज़ एक बार पढ़ना भी लाभकारी है।" },
        { q: "सुबह या शाम कब पढ़ें?", a: "दोनों समय ठीक हैं, नियमितता रखें।" },
        { q: "क्या मंत्र के साथ पढ़ सकते हैं?", a: "हाँ, मंत्र के बाद चालीसा पढ़ना अच्छा रहता है।" },
        { q: "क्या व्रत जरूरी है?", a: "नहीं, व्रत वैकल्पिक है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "krishna",
    topic: "bhajan",
    slug: "/krishna/bhajan",
    h1: { en: "Krishna bhajan for daily devotion", hi: "कृष्ण भजन से रोज़ की भक्ति" },
    title: { en: "Krishna Bhajan | Simple daily bhakti routine", hi: "कृष्ण भजन | सरल दैनिक भक्ति अभ्यास" },
    description: { en: "Learn how to include Krishna bhajan in your day for calm and devotional focus.", hi: "कृष्ण भजन को रोज़मर्रा में शामिल करने का आसान तरीका सीखें और मन को शांत रखें।" },
    intro: { en: "Bhajan is a gentle way to keep devotion alive in busy schedules.", hi: "व्यस्त दिनचर्या में भी भजन भक्ति को जीवित रखने का सरल और सहज माध्यम है।" },
    sections: [
      { heading: { en: "Choosing bhajans", hi: "भजन कैसे चुनें" }, paragraphs: [{ en: "Pick short bhajans you can sing consistently.", hi: "ऐसे छोटे भजन चुनें जिन्हें आप रोज़ नियमित गा सकें।" }] },
      { heading: { en: "Family practice", hi: "परिवार के साथ अभ्यास" }, paragraphs: [{ en: "A 10-minute evening bhajan can become a strong family ritual.", hi: "शाम का 10 मिनट का भजन परिवार का अच्छा आध्यात्मिक समय बन सकता है।" }] }
    ],
    howToHeading: { en: "How to start", hi: "कैसे शुरू करें" },
    howToSteps: [
      { en: "Choose one Krishna bhajan.", hi: "एक कृष्ण भजन चुनें।" },
      { en: "Sing or listen with full attention.", hi: "पूरे ध्यान से गाएँ या सुनें।" },
      { en: "End with one line of gratitude.", hi: "अंत में कृतज्ञता की एक पंक्ति बोलें।" }
    ],
    faqs: {
      en: [
        { q: "Is musical training required?", a: "No, devotion matters more than performance." },
        { q: "Can I listen instead of singing?", a: "Yes, mindful listening is also devotional." },
        { q: "How long should bhajan be?", a: "5 to 15 minutes is enough to start." },
        { q: "Can children join?", a: "Yes, short bhajans are great for children too." }
      ],
      hi: [
        { q: "क्या भजन के लिए संगीत सीखना जरूरी है?", a: "नहीं, प्रस्तुति से अधिक भक्ति भाव महत्वपूर्ण है।" },
        { q: "क्या गाने की जगह सुन सकते हैं?", a: "हाँ, ध्यान से सुनना भी भक्ति का हिस्सा है।" },
        { q: "भजन कितनी देर का हो?", a: "शुरुआत के लिए 5 से 15 मिनट पर्याप्त हैं।" },
        { q: "क्या बच्चे भी शामिल हो सकते हैं?", a: "हाँ, छोटे भजन बच्चों के लिए भी अच्छे होते हैं।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "krishna",
    topic: "gita-shlok",
    slug: "/krishna/gita-shlok",
    h1: { en: "Bhagavad Gita verses with simple explanations", hi: "भगवद गीता के श्लोक और आसान अर्थ" },
    title: { en: "Bhagavad Gita Shlok | Easy meanings", hi: "भगवद गीता के श्लोक | सरल अर्थ और सीख" },
    description: { en: "Read selected Bhagavad Gita verses with short practical meaning in simple Hindi.", hi: "भगवद गीता के चुने हुए श्लोक, सरल अर्थ और दैनिक जीवन में उपयोग की स्पष्ट समझ पाएँ।" },
    intro: { en: "Gita verses become useful when connected with daily action.", hi: "गीता के श्लोक तभी उपयोगी होते हैं जब उन्हें रोज़ के निर्णयों से जोड़ा जाए।" },
    sections: [
      { heading: { en: "How to read a shlok", hi: "श्लोक कैसे पढ़ें" }, paragraphs: [{ en: "Read the line, then read a plain meaning, then connect it with one real situation.", hi: "पहले श्लोक पढ़ें, फिर उसका सरल अर्थ समझें, और फिर उसे अपनी किसी वास्तविक स्थिति से जोड़ें।" }] },
      { heading: { en: "Daily use", hi: "दैनिक उपयोग" }, paragraphs: [{ en: "Pick one verse for the day and apply one practical point.", hi: "दिन के लिए एक श्लोक चुनें और उसकी एक सीख को व्यवहार में लाएँ।" }] }
    ],
    howToHeading: { en: "Simple method", hi: "सरल तरीका" },
    howToSteps: [
      { en: "Read one verse slowly.", hi: "एक श्लोक धीरे पढ़ें।" },
      { en: "Note one meaning in plain words.", hi: "उसका एक सरल अर्थ लिखें।" },
      { en: "Apply one small action today.", hi: "आज उसी पर एक छोटा कदम लें।" }
    ],
    faqs: {
      en: [
        { q: "Do I need Sanskrit to study Gita?", a: "No, simple language explanations are enough to begin." },
        { q: "How many verses should I read daily?", a: "One or two verses daily is practical." },
        { q: "Can beginners start here?", a: "Yes, this page is beginner-friendly." },
        { q: "Does this replace full Gita study?", a: "No, this is a practical starting point." }
      ],
      hi: [
        { q: "क्या गीता समझने के लिए संस्कृत जरूरी है?", a: "नहीं, सरल भाषा में अर्थ से भी शुरुआत की जा सकती है।" },
        { q: "रोज़ कितने श्लोक पढ़ें?", a: "रोज़ 1 या 2 श्लोक पढ़ना व्यावहारिक है।" },
        { q: "क्या शुरुआती लोग भी यहाँ से शुरू कर सकते हैं?", a: "हाँ, यह पेज शुरुआती लोगों के लिए बनाया गया है।" },
        { q: "क्या इससे पूरी गीता का अध्ययन हो जाएगा?", a: "नहीं, यह व्यावहारिक शुरुआत का माध्यम है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "lakshmi",
    topic: "mantra",
    slug: "/lakshmi/mantra",
    h1: { en: "Lakshmi mantra and simple chanting method", hi: "लक्ष्मी मंत्र और आसान जप विधि" },
    title: { en: "Lakshmi Mantra | Simple chant and meaning", hi: "लक्ष्मी मंत्र | सरल जप और अर्थ" },
    description: { en: "Read Lakshmi mantra with practical chanting routine for peace and prosperity mindset.", hi: "लक्ष्मी मंत्र, आसान जप विधि और समृद्धि के लिए शांत मानसिकता बनाने का तरीका जानें।" },
    intro: { en: "Lakshmi mantra supports gratitude and disciplined prosperity habits.", hi: "लक्ष्मी मंत्र कृतज्ञता और अनुशासित समृद्धि आदतें बनाने में सहायक है।" },
    sections: [
      { heading: { en: "Core mantra", hi: "मुख्य मंत्र" }, paragraphs: [{ en: "A common mantra is: ॐ श्रीं महालक्ष्म्यै नमः.", hi: "एक प्रचलित मंत्र है: ॐ श्रीं महालक्ष्म्यै नमः।" }] },
      { heading: { en: "Mindset", hi: "मानसिकता" }, paragraphs: [{ en: "Chant with gratitude, not fear of lack.", hi: "जप कृतज्ञता के साथ करें, कमी के डर के साथ नहीं।" }] }
    ],
    howToHeading: { en: "How to chant", hi: "कैसे जपें" },
    howToSteps: [
      { en: "Sit calmly and take 3 slow breaths.", hi: "शांत बैठकर 3 गहरी साँस लें।" },
      { en: "Chant 11 times with focus.", hi: "11 बार ध्यान से जपें।" },
      { en: "Write one money discipline action for today.", hi: "आज के लिए एक धन अनुशासन कदम लिखें।" }
    ],
    faqs: {
      en: [
        { q: "Can I chant daily?", a: "Yes, daily consistency is best." },
        { q: "Morning or evening?", a: "Morning is ideal, evening also works." },
        { q: "Can working professionals chant?", a: "Yes, even 5 minutes is useful." },
        { q: "Is this a guaranteed wealth method?", a: "No, it supports mindset and discipline." }
      ],
      hi: [
        { q: "क्या यह मंत्र रोज़ जपा जा सकता है?", a: "हाँ, रोज़ का जप सबसे बेहतर माना जाता है।" },
        { q: "सुबह करें या शाम?", a: "सुबह अच्छा समय है, शाम भी कर सकते हैं।" },
        { q: "क्या नौकरी करने वाले लोग भी जप सकते हैं?", a: "हाँ, 5 मिनट का नियमित जप भी लाभकारी है।" },
        { q: "क्या इससे धन की गारंटी मिलती है?", a: "नहीं, यह मानसिकता और अनुशासन को मजबूत करता है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "lakshmi",
    topic: "aarti",
    slug: "/lakshmi/aarti",
    h1: { en: "Lakshmi Aarti with easy daily routine", hi: "लक्ष्मी आरती और सरल दैनिक विधि" },
    title: { en: "Lakshmi Aarti | Simple daily practice", hi: "लक्ष्मी आरती | सरल दैनिक पाठ" },
    description: { en: "Learn Lakshmi Aarti timing, simple setup, and devotional routine for home peace.", hi: "लक्ष्मी आरती का सही समय, घर पर आसान विधि और शांत भक्ति अभ्यास जानें।" },
    intro: { en: "Lakshmi Aarti helps create a peaceful and disciplined home atmosphere.", hi: "लक्ष्मी आरती घर में शांति, संतुलन और सकारात्मकता का वातावरण बनाती है।" },
    sections: [
      { heading: { en: "Best time", hi: "उचित समय" }, paragraphs: [{ en: "Evening is common, especially on Fridays and festivals.", hi: "शाम का समय सामान्यतः अच्छा माना जाता है, खासकर शुक्रवार और त्योहारों में।" }] },
      { heading: { en: "Simple setup", hi: "सरल तैयारी" }, paragraphs: [{ en: "Keep diya, flowers, and clean altar space.", hi: "दीपक, फूल और साफ पूजा स्थान रखें।" }] }
    ],
    howToHeading: { en: "How to do", hi: "कैसे करें" },
    howToSteps: [
      { en: "Clean the prayer space.", hi: "पूजा स्थान साफ करें।" },
      { en: "Light diya and recite Lakshmi Aarti.", hi: "दीपक जलाकर लक्ष्मी आरती पढ़ें।" },
      { en: "Close with gratitude for what you already have.", hi: "अंत में जो मिला है उसके लिए कृतज्ञता रखें।" }
    ],
    faqs: {
      en: [
        { q: "Can I do Lakshmi Aarti daily?", a: "Yes, daily or weekly on Fridays works well." },
        { q: "Is festival-only recitation enough?", a: "Regular short practice is better." },
        { q: "Can I recite with family?", a: "Yes, family recitation is encouraged." },
        { q: "Do I need full puja items?", a: "No, simple sincere setup is enough." }
      ],
      hi: [
        { q: "क्या लक्ष्मी आरती रोज़ कर सकते हैं?", a: "हाँ, रोज़ या शुक्रवार को नियमित करना अच्छा रहता है।" },
        { q: "क्या सिर्फ त्योहार पर करना पर्याप्त है?", a: "नियमित छोटी साधना अधिक लाभकारी है।" },
        { q: "क्या परिवार के साथ आरती कर सकते हैं?", a: "हाँ, परिवार के साथ आरती करना बहुत शुभ माना जाता है।" },
        { q: "क्या पूरी पूजा सामग्री जरूरी है?", a: "नहीं, सरल और श्रद्धापूर्ण तैयारी भी पर्याप्त है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "lakshmi",
    topic: "chalisa",
    slug: "/lakshmi/chalisa",
    h1: { en: "Lakshmi Chalisa with simple understanding", hi: "लक्ष्मी चालीसा और सरल समझ" },
    title: { en: "Lakshmi Chalisa | Easy reading guide", hi: "लक्ष्मी चालीसा | आसान पाठ मार्गदर्शन" },
    description: { en: "Read Lakshmi Chalisa with simple meaning and regular devotion routine.", hi: "लक्ष्मी चालीसा का सरल पाठ, अर्थ और नियमित अभ्यास का तरीका जानें।" },
    intro: { en: "Lakshmi Chalisa encourages gratitude, purity of intention, and disciplined effort.", hi: "लक्ष्मी चालीसा कृतज्ञता, शुद्ध भाव और अनुशासित प्रयास को मजबूत करती है।" },
    sections: [
      { heading: { en: "Purpose", hi: "उद्देश्य" }, paragraphs: [{ en: "Recite to build devotional focus and mental stability.", hi: "भक्ति भाव और मन की स्थिरता बढ़ाने के लिए चालीसा पढ़ी जाती है।" }] },
      { heading: { en: "Practice rhythm", hi: "अभ्यास क्रम" }, paragraphs: [{ en: "Small daily recitation builds stronger habit than occasional long sessions.", hi: "कभी-कभी लंबे पाठ से बेहतर है रोज़ का छोटा और नियमित पाठ।" }] }
    ],
    howToHeading: { en: "How to read", hi: "कैसे पढ़ें" },
    howToSteps: [
      { en: "Read once daily with focus.", hi: "रोज़ एक बार ध्यान से पढ़ें।" },
      { en: "Avoid haste and keep pronunciation clear.", hi: "जल्दी न करें और उच्चारण साफ रखें।" },
      { en: "End with one gratitude sentence.", hi: "अंत में कृतज्ञता की एक पंक्ति बोलें।" }
    ],
    faqs: {
      en: [
        { q: "Can beginners read Lakshmi Chalisa?", a: "Yes, beginners can start with one reading daily." },
        { q: "Can I read on Fridays only?", a: "Yes, Friday is common, daily is also good." },
        { q: "How long does it take?", a: "Usually 7 to 12 minutes." },
        { q: "Can I combine with mantra?", a: "Yes, mantra plus chalisa works well." }
      ],
      hi: [
        { q: "क्या शुरुआती लोग लक्ष्मी चालीसा पढ़ सकते हैं?", a: "हाँ, शुरुआती लोग भी रोज़ एक बार पढ़कर शुरुआत कर सकते हैं।" },
        { q: "क्या सिर्फ शुक्रवार को पढ़ना ठीक है?", a: "हाँ, शुक्रवार अच्छा माना जाता है, रोज़ पढ़ना भी उत्तम है।" },
        { q: "इसे पढ़ने में कितना समय लगता है?", a: "आमतौर पर 7 से 12 मिनट लगते हैं।" },
        { q: "क्या मंत्र और चालीसा साथ कर सकते हैं?", a: "हाँ, मंत्र के साथ चालीसा पढ़ना अच्छा रहता है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "lakshmi",
    topic: "puja-vidhi",
    slug: "/lakshmi/puja-vidhi",
    h1: { en: "Lakshmi puja vidhi in easy steps", hi: "लक्ष्मी पूजा विधि आसान स्टेप्स में" },
    title: { en: "Lakshmi Puja Vidhi | Simple home method", hi: "लक्ष्मी पूजा विधि | घर पर आसान तरीका" },
    description: { en: "Step-by-step Lakshmi puja vidhi in simple language for daily and festival worship.", hi: "लक्ष्मी पूजा विधि सरल भाषा में। घर पर दैनिक और त्योहार पूजा के आसान स्टेप्स जानें।" },
    intro: { en: "Lakshmi puja vidhi should remain simple, clean, and sincere.", hi: "लक्ष्मी पूजा विधि सरल, स्वच्छ और श्रद्धापूर्ण होनी चाहिए।" },
    sections: [
      { heading: { en: "Preparation", hi: "तैयारी" }, paragraphs: [{ en: "Clean space, diya, flowers, and simple naivedya are enough.", hi: "साफ स्थान, दीपक, फूल और साधारण नैवेद्य पर्याप्त हैं।" }] },
      { heading: { en: "During puja", hi: "पूजा के दौरान" }, paragraphs: [{ en: "Keep attention on gratitude and honest effort, not show.", hi: "पूजा में दिखावे से अधिक कृतज्ञता और सच्चे प्रयास पर ध्यान रखें।" }] }
    ],
    howToHeading: { en: "Simple steps", hi: "कैसे करें" },
    howToSteps: [
      { en: "Clean and set the altar.", hi: "पूजा स्थान साफ करके तैयार करें।" },
      { en: "Offer diya, flowers, and mantra.", hi: "दीपक, फूल और मंत्र अर्पित करें।" },
      { en: "Read aarti and close with gratitude.", hi: "आरती पढ़कर कृतज्ञता के साथ पूजा पूर्ण करें।" }
    ],
    faqs: {
      en: [
        { q: "Can I do Lakshmi puja without priest?", a: "Yes, simple home puja is valid with devotion." },
        { q: "Is Friday mandatory?", a: "No, Friday is common but not mandatory." },
        { q: "Can working people do short puja?", a: "Yes, short sincere puja is meaningful." },
        { q: "Do I need expensive offerings?", a: "No, simple offerings are enough." }
      ],
      hi: [
        { q: "क्या पंडित के बिना लक्ष्मी पूजा कर सकते हैं?", a: "हाँ, घर पर श्रद्धा से की गई सरल पूजा भी मान्य है।" },
        { q: "क्या शुक्रवार ही जरूरी है?", a: "नहीं, शुक्रवार शुभ माना जाता है पर अनिवार्य नहीं है।" },
        { q: "क्या नौकरी करने वाले लोग छोटी पूजा कर सकते हैं?", a: "हाँ, छोटी लेकिन नियमित पूजा भी प्रभावी होती है।" },
        { q: "क्या महंगी सामग्री जरूरी है?", a: "नहीं, सरल सामग्री पर्याप्त है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "lakshmi",
    topic: "katha",
    slug: "/lakshmi/katha",
    h1: { en: "Lakshmi Ji katha in easy language", hi: "लक्ष्मी जी की कथा सरल भाषा में" },
    title: { en: "Lakshmi Ji Katha | Meaning and daily lesson", hi: "लक्ष्मी जी की कथा | अर्थ और सीख" },
    description: { en: "Read Lakshmi Ji katha in simple words with practical lessons for home and financial discipline.", hi: "लक्ष्मी जी की कथा सरल शब्दों में पढ़ें और घर, कृतज्ञता व धन अनुशासन की सीख समझें।" },
    intro: { en: "Lakshmi katha reminds us that prosperity stays where respect and discipline stay.", hi: "लक्ष्मी कथा याद दिलाती है कि समृद्धि वहीं टिकती है जहाँ सम्मान, स्वच्छता और अनुशासन रहता है।" },
    sections: [
      { heading: { en: "Main lesson", hi: "मुख्य सीख" }, paragraphs: [{ en: "Right conduct and gratitude matter more than shortcuts.", hi: "शॉर्टकट से ज़्यादा सही आचरण और कृतज्ञता का महत्व है।" }] },
      { heading: { en: "Daily use", hi: "दैनिक जीवन में उपयोग" }, paragraphs: [{ en: "Convert the katha into one practical daily habit.", hi: "कथा की सीख को रोज़ की एक व्यवहारिक आदत में बदलें।" }] }
    ],
    howToHeading: { en: "How to include in routine", hi: "कैसे अपनाएँ" },
    howToSteps: [
      { en: "Read one short katha section weekly.", hi: "सप्ताह में एक बार कथा का छोटा भाग पढ़ें।" },
      { en: "Discuss one lesson with family.", hi: "परिवार के साथ एक सीख पर चर्चा करें।" },
      { en: "Apply one discipline in spending or savings.", hi: "खर्च या बचत में एक अनुशासन लागू करें।" }
    ],
    faqs: {
      en: [
        { q: "Is Lakshmi katha only for festivals?", a: "No, it can be read anytime." },
        { q: "Can children understand it?", a: "Yes, simple versions are easy for families." },
        { q: "Is this linked to money discipline?", a: "Yes, the lessons support balanced habits." },
        { q: "How long should reading be?", a: "10 to 15 minutes is enough." }
      ],
      hi: [
        { q: "क्या लक्ष्मी कथा सिर्फ त्योहारों में पढ़ी जाती है?", a: "नहीं, इसे किसी भी समय पढ़ा जा सकता है।" },
        { q: "क्या बच्चे भी कथा समझ सकते हैं?", a: "हाँ, सरल भाषा में कथा परिवार के लिए उपयुक्त है।" },
        { q: "क्या इसका संबंध धन अनुशासन से है?", a: "हाँ, कथा की सीख संतुलित आर्थिक आदतें बनाती है।" },
        { q: "कथा पढ़ने में कितना समय दें?", a: "10 से 15 मिनट पर्याप्त हैं।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "shani",
    topic: "mantra",
    slug: "/shani/mantra",
    h1: { en: "Shani mantra with clear practice", hi: "शनि मंत्र और स्पष्ट जप विधि" },
    title: { en: "Shani Mantra | Simple chanting guide", hi: "शनि मंत्र | सरल जप मार्गदर्शन" },
    description: { en: "Read Shani mantra with easy chanting routine for discipline and calm focus.", hi: "शनि मंत्र का सरल जप तरीका जानें। अनुशासन, धैर्य और मानसिक स्थिरता के लिए उपयोगी मार्गदर्शन।" },
    intro: { en: "Shani mantra is best practiced with discipline and sincerity.", hi: "शनि मंत्र का जप अनुशासन और श्रद्धा के साथ सबसे अधिक फलदायी माना जाता है।" },
    sections: [
      { heading: { en: "Common mantra", hi: "प्रचलित मंत्र" }, paragraphs: [{ en: "A common mantra is: ॐ शं शनैश्चराय नमः.", hi: "एक प्रचलित मंत्र है: ॐ शं शनैश्चराय नमः।" }] },
      { heading: { en: "Intent", hi: "भाव" }, paragraphs: [{ en: "Chant for responsibility and steadiness, not fear.", hi: "जप डर के लिए नहीं, जिम्मेदारी और स्थिरता के भाव से करें।" }] }
    ],
    howToHeading: { en: "How to chant", hi: "कैसे जपें" },
    howToSteps: [
      { en: "Sit quietly and keep spine straight.", hi: "शांत बैठें और पीठ सीधी रखें।" },
      { en: "Chant 11 times with steady rhythm.", hi: "11 बार स्थिर लय में जप करें।" },
      { en: "Follow with one disciplined task.", hi: "इसके बाद दिन का एक अनुशासित काम पूरा करें।" }
    ],
    disclaimer: {
      en: "This content is devotional and educational. It is not medical, legal, or financial advice.",
      hi: "यह सामग्री भक्तिमय और शैक्षणिक उद्देश्य के लिए है। यह मेडिकल, लीगल या वित्तीय सलाह नहीं है।"
    },
    faqs: {
      en: [
        { q: "Can I chant Shani mantra daily?", a: "Yes, daily or on Saturdays both are common." },
        { q: "How many repetitions are good for beginners?", a: "Start with 11 repetitions." },
        { q: "Can this remove all problems instantly?", a: "No, it supports discipline over time." },
        { q: "Should I chant with fear?", a: "No, chant with responsibility and calmness." }
      ],
      hi: [
        { q: "क्या शनि मंत्र रोज़ जप सकते हैं?", a: "हाँ, रोज़ या शनिवार दोनों समय जप किया जा सकता है।" },
        { q: "शुरुआत में कितनी बार जप करें?", a: "शुरुआत 11 बार से करें।" },
        { q: "क्या इससे तुरंत सारी समस्याएँ खत्म हो जाती हैं?", a: "नहीं, यह समय के साथ अनुशासन और स्थिरता बढ़ाता है।" },
        { q: "क्या मंत्र डर के साथ जपना चाहिए?", a: "नहीं, मंत्र जिम्मेदारी और शांत मन से जपें।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "shani",
    topic: "aarti",
    slug: "/shani/aarti",
    h1: { en: "Shani Aarti with easy home routine", hi: "शनि आरती और आसान घरेलू विधि" },
    title: { en: "Shani Aarti | Simple recitation guide", hi: "शनि आरती | सरल पाठ मार्गदर्शिका" },
    description: { en: "Read Shani Aarti with simple timing and respectful daily worship routine.", hi: "शनि आरती के बोल, सही समय और घर पर करने की सरल पूजा विधि जानें।" },
    intro: { en: "Shani Aarti helps build seriousness and steadiness in devotional practice.", hi: "शनि आरती भक्ति में गंभीरता, धैर्य और निरंतरता लाने में मदद करती है।" },
    sections: [
      { heading: { en: "When to do", hi: "कब करें" }, paragraphs: [{ en: "Saturday evening is commonly preferred.", hi: "शनिवार की शाम सामान्यतः उपयुक्त मानी जाती है।" }] },
      { heading: { en: "Simple discipline", hi: "सरल अनुशासन" }, paragraphs: [{ en: "Keep practice simple, regular, and respectful.", hi: "आरती को सरल, नियमित और सम्मानपूर्वक करें।" }] }
    ],
    howToHeading: { en: "How to perform", hi: "कैसे करें" },
    howToSteps: [
      { en: "Light diya and sit in silence for a minute.", hi: "दीपक जलाकर एक मिनट शांत बैठें।" },
      { en: "Recite Shani Aarti clearly.", hi: "शनि आरती स्पष्ट उच्चारण के साथ पढ़ें।" },
      { en: "End with a commitment to right action.", hi: "अंत में सही कर्म का संकल्प लें।" }
    ],
    disclaimer: {
      en: "This content is devotional and educational. It is not medical, legal, or financial advice.",
      hi: "यह सामग्री भक्तिमय और शैक्षणिक उद्देश्य के लिए है। यह मेडिकल, लीगल या वित्तीय सलाह नहीं है।"
    },
    faqs: {
      en: [
        { q: "Can I do Shani Aarti without full puja setup?", a: "Yes, simple sincere setup is enough." },
        { q: "Is Saturday mandatory?", a: "No, but Saturday is traditionally preferred." },
        { q: "Can beginners perform it?", a: "Yes, beginners can start with simple routine." },
        { q: "Should I do it only during bad phases?", a: "No, regular devotion is better." }
      ],
      hi: [
        { q: "क्या पूरी पूजा सामग्री बिना शनि आरती कर सकते हैं?", a: "हाँ, श्रद्धा के साथ सरल आरती भी पर्याप्त है।" },
        { q: "क्या शनिवार ही जरूरी है?", a: "नहीं, पर परंपरा में शनिवार को विशेष महत्व दिया जाता है।" },
        { q: "क्या शुरुआती लोग भी कर सकते हैं?", a: "हाँ, शुरुआती लोग सरल तरीके से शुरू कर सकते हैं।" },
        { q: "क्या आरती सिर्फ कठिन समय में करनी चाहिए?", a: "नहीं, नियमित भक्ति अधिक लाभकारी होती है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "shani",
    topic: "chalisa",
    slug: "/shani/chalisa",
    h1: { en: "Shani Chalisa for discipline and patience", hi: "शनि चालीसा धैर्य और अनुशासन के लिए" },
    title: { en: "Shani Chalisa | Easy reading in simple language", hi: "शनि चालीसा | सरल भाषा में पाठ" },
    description: { en: "Read Shani Chalisa in easy language with practical routine and devotional focus.", hi: "शनि चालीसा का सरल पाठ, अनुशासित दिनचर्या और भक्तिभाव के साथ अभ्यास का तरीका जानें।" },
    intro: { en: "Shani Chalisa is often used to cultivate patience and accountability.", hi: "शनि चालीसा धैर्य, आत्मनियंत्रण और जिम्मेदारी का भाव मजबूत करने के लिए पढ़ी जाती है।" },
    sections: [
      { heading: { en: "Why it helps", hi: "यह क्यों उपयोगी है" }, paragraphs: [{ en: "It keeps attention on correction, discipline, and steady progress.", hi: "यह मन को सुधार, अनुशासन और स्थिर प्रगति पर केंद्रित रखती है।" }] },
      { heading: { en: "Reading habit", hi: "पाठ की आदत" }, paragraphs: [{ en: "Regular short recitation is better than occasional long recitation.", hi: "कभी-कभी लंबा पाठ करने से बेहतर है नियमित छोटा पाठ।" }] }
    ],
    howToHeading: { en: "How to read", hi: "कैसे पढ़ें" },
    howToSteps: [
      { en: "Choose a fixed day/time.", hi: "एक निश्चित दिन और समय चुनें।" },
      { en: "Read once with attention.", hi: "एक बार ध्यान से पढ़ें।" },
      { en: "Apply one discipline in daily routine.", hi: "दिनचर्या में एक अनुशासित सुधार लागू करें।" }
    ],
    disclaimer: {
      en: "This content is devotional and educational. It is not medical, legal, or financial advice.",
      hi: "यह सामग्री भक्तिमय और शैक्षणिक उद्देश्य के लिए है। यह मेडिकल, लीगल या वित्तीय सलाह नहीं है।"
    },
    faqs: {
      en: [
        { q: "Can I read Shani Chalisa every Saturday?", a: "Yes, Saturday recitation is common and meaningful." },
        { q: "Can I read it daily?", a: "Yes, daily short recitation is fine." },
        { q: "Will this give instant results?", a: "No, it supports gradual inner and behavioral change." },
        { q: "Can I read without rituals?", a: "Yes, sincere reading is valid." }
      ],
      hi: [
        { q: "क्या शनि चालीसा हर शनिवार पढ़ सकते हैं?", a: "हाँ, शनिवार का पाठ परंपरा में बहुत सामान्य है।" },
        { q: "क्या इसे रोज़ पढ़ना ठीक है?", a: "हाँ, रोज़ का छोटा पाठ भी अच्छा है।" },
        { q: "क्या इससे तुरंत परिणाम मिलते हैं?", a: "नहीं, यह धीरे-धीरे भीतर और व्यवहार में बदलाव लाती है।" },
        { q: "क्या बिना विधि-विधान के पढ़ सकते हैं?", a: "हाँ, श्रद्धा के साथ पढ़ना पर्याप्त है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "shani",
    topic: "vrat-katha",
    slug: "/shani/vrat-katha",
    h1: { en: "Saturday vrat katha for Shani Dev", hi: "शनिवार व्रत कथा और शनि साधना" },
    title: { en: "Saturday Vrat Katha | Shani Dev guide", hi: "शनिवार व्रत कथा | शनि देव मार्गदर्शन" },
    description: { en: "Understand Saturday vrat katha, simple fasting routine, and devotional discipline in clear language.", hi: "शनिवार व्रत कथा, व्रत के नियम और शनि भक्ति के सरल तरीके को स्पष्ट हिंदी में समझें।" },
    intro: { en: "Saturday vrat katha is followed for discipline, patience, and correction in conduct.", hi: "शनिवार व्रत कथा धैर्य, अनुशासन और आचरण सुधार की भावना से की जाती है।" },
    sections: [
      { heading: { en: "What is the core intent", hi: "मुख्य भाव क्या है" }, paragraphs: [{ en: "The focus is on self-correction and responsible action, not fear.", hi: "इसका मुख्य भाव डर नहीं, बल्कि आत्मसुधार और जिम्मेदार कर्म है।" }] },
      { heading: { en: "Food and discipline", hi: "भोजन और अनुशासन" }, paragraphs: [{ en: "Keep the vrat simple, balanced, and suitable to your health.", hi: "व्रत को सरल, संतुलित और अपनी स्वास्थ्य स्थिति के अनुसार रखें।" }] }
    ],
    howToHeading: { en: "How to observe", hi: "कैसे करें" },
    howToSteps: [
      { en: "Set a clear intention on Friday night.", hi: "शुक्रवार रात स्पष्ट संकल्प लें।" },
      { en: "Read Saturday vrat katha with attention.", hi: "शनिवार व्रत कथा ध्यान से पढ़ें।" },
      { en: "Do one act of service and one disciplined task.", hi: "एक सेवा कार्य और एक अनुशासित काम पूरा करें।" }
    ],
    disclaimer: {
      en: "This content is devotional and educational. For health, legal, or financial concerns, consult qualified professionals.",
      hi: "यह सामग्री भक्तिमय और शैक्षणिक उद्देश्य के लिए है। स्वास्थ्य, कानूनी या आर्थिक मामलों में योग्य विशेषज्ञ की सलाह लें।"
    },
    faqs: {
      en: [
        { q: "How is Saturday vrat observed?", a: "With simple fasting, prayer, and disciplined conduct." },
        { q: "What can be eaten in vrat?", a: "Follow balanced sattvic options suitable for your health." },
        { q: "What should be avoided?", a: "Avoid harmful behavior, anger, and carelessness." },
        { q: "Best time for Shani worship?", a: "Saturday morning or evening with consistency." }
      ],
      hi: [
        { q: "शनिवार व्रत कैसे रखा जाता है?", a: "सरल उपवास, कथा-पाठ, प्रार्थना और अनुशासित आचरण के साथ रखा जाता है।" },
        { q: "शनिवार व्रत में क्या खाएं?", a: "संतुलित सात्विक भोजन लें और स्वास्थ्य के अनुसार नियम रखें।" },
        { q: "शनिवार व्रत में क्या न करें?", a: "क्रोध, गलत आचरण और लापरवाही से बचें।" },
        { q: "शनि देव की पूजा का सही समय क्या है?", a: "शनिवार सुबह या शाम नियमित भाव से पूजा करना उत्तम माना जाता है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  },
  {
    deity: "shani",
    topic: "puja-vidhi",
    slug: "/shani/puja-vidhi",
    h1: { en: "Shani puja vidhi in clear simple steps", hi: "शनि पूजा विधि सरल और स्पष्ट स्टेप्स में" },
    title: { en: "Shani Puja Vidhi | Easy home worship", hi: "शनि पूजा विधि | घर पर आसान तरीका" },
    description: { en: "Step-by-step Shani puja vidhi with practical devotional guidance and discipline-focused routine.", hi: "शनि पूजा विधि को आसान स्टेप्स में समझें। घर पर शांत, अनुशासित और भक्तिमय पूजा कैसे करें जानें।" },
    intro: { en: "Shani puja vidhi should be simple, truthful, and disciplined.", hi: "शनि पूजा विधि को सरल, सत्यनिष्ठ और अनुशासित भाव से करना सर्वोत्तम माना जाता है।" },
    sections: [
      { heading: { en: "Simple preparation", hi: "सरल तैयारी" }, paragraphs: [{ en: "Keep puja place clean and free from distraction.", hi: "पूजा स्थान साफ रखें और अनावश्यक व्यवधान से बचें।" }] },
      { heading: { en: "Practical focus", hi: "व्यावहारिक केंद्र" }, paragraphs: [{ en: "Pair puja with one corrective action in real life.", hi: "पूजा के साथ जीवन में एक सुधारात्मक कदम भी जोड़ें।" }] }
    ],
    howToHeading: { en: "How to perform", hi: "कैसे करें" },
    howToSteps: [
      { en: "Prepare a clean worship space.", hi: "स्वच्छ पूजा स्थान तैयार करें।" },
      { en: "Offer diya, mantra, and aarti calmly.", hi: "शांत भाव से दीप, मंत्र और आरती अर्पित करें।" },
      { en: "End with one accountability commitment.", hi: "अंत में एक जिम्मेदार संकल्प लें।" }
    ],
    disclaimer: {
      en: "This content is devotional and educational. It is not medical, legal, or financial advice.",
      hi: "यह सामग्री भक्तिमय और शैक्षणिक उद्देश्य के लिए है। यह मेडिकल, लीगल या वित्तीय सलाह नहीं है।"
    },
    faqs: {
      en: [
        { q: "Can I do Shani puja at home?", a: "Yes, simple home puja is valid with devotion." },
        { q: "Do I need special materials?", a: "No, basic simple items are enough." },
        { q: "Should puja be fear-driven?", a: "No, it should be grounded in discipline and sincerity." },
        { q: "Can I combine with mantra and chalisa?", a: "Yes, a short combined routine works well." }
      ],
      hi: [
        { q: "क्या शनि पूजा घर पर कर सकते हैं?", a: "हाँ, श्रद्धा के साथ घर पर सरल पूजा की जा सकती है।" },
        { q: "क्या विशेष सामग्री जरूरी है?", a: "नहीं, सामान्य और सरल सामग्री पर्याप्त है।" },
        { q: "क्या पूजा डर के भाव से करनी चाहिए?", a: "नहीं, पूजा अनुशासन और सत्यनिष्ठा के भाव से करें।" },
        { q: "क्या मंत्र और चालीसा साथ कर सकते हैं?", a: "हाँ, छोटा संयुक्त अभ्यास किया जा सकता है।" }
      ]
    },
    publishedAt: "2026-02-21",
    updatedAt: "2026-02-21"
  }
];

export const TOPIC_CONTENT_BY_SLUG = Object.fromEntries(
  topicContentList.map((item) => [`${item.deity}:${item.topic}`, item])
) as Record<string, TopicContent>;

export function getHubContent(deity: DeitySlug) {
  return HUB_CONTENT[deity];
}

export function getTopicContent(deity: DeitySlug, topic: string) {
  return TOPIC_CONTENT_BY_SLUG[`${deity}:${topic}`] ?? null;
}

export const DEITY_TOPICS: Record<DeitySlug, string[]> = {
  krishna: ["mantra", "aarti", "chalisa", "bhajan", "gita-shlok"],
  lakshmi: ["mantra", "aarti", "chalisa", "puja-vidhi", "katha"],
  shani: ["mantra", "aarti", "chalisa", "vrat-katha", "puja-vidhi"]
};

export function getLocaleText<T extends LocalizedText>(text: T, locale: Locale) {
  return locale === "hi" ? text.hi : text.en;
}

export function getFaqForLocale(faqs: LocalizedFaq, locale: Locale) {
  return locale === "hi" ? faqs.hi : faqs.en;
}

export function getRelatedKeywordTargets(deity: DeitySlug) {
  return {
    core: HI_KEYWORD_MAP.core,
    deity: HI_KEYWORD_MAP[deity],
    general: HI_KEYWORD_MAP.general
  };
}
