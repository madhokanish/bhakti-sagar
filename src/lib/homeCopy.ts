export type HomeLang = "en" | "hinglish" | "hi";

export const HOME_LANG_COOKIE = "BHAKTI_LANG";
export const HOME_LANG_STORAGE_KEY = "bhakti_lang";

export function isHomeLang(value: string | null | undefined): value is HomeLang {
  return value === "en" || value === "hinglish" || value === "hi";
}

export function resolveHomeLang(value: string | null | undefined, fallback: HomeLang = "en"): HomeLang {
  return isHomeLang(value) ? value : fallback;
}

export type HomeCopy = {
  hero_title: string;
  hero_subtitle: string;
  featured_label: string;
  featured_krishna_title: string;
  featured_krishna_desc: string;
  featured_lakshmi_title: string;
  featured_lakshmi_desc: string;
  featured_shani_title: string;
  featured_shani_desc: string;
  trust_1_title: string;
  trust_1_desc: string;
  trust_2_title: string;
  trust_2_desc: string;
  trust_3_title: string;
  trust_3_desc: string;
  rating_label: string;
  rating_value: string;
  rating_desc: string;
  stats_1_label: string;
  stats_1_value: string;
  stats_2_label: string;
  stats_2_value: string;
  stats_3_label: string;
  stats_3_value: string;
  stats_3_suffix: string;
  testimonial_1: string;
  testimonial_1_meta: string;
  testimonial_2: string;
  testimonial_2_meta: string;
  testimonial_3: string;
  testimonial_3_meta: string;
  disclaimer_title: string;
  disclaimer_desc: string;
  more_tools_label: string;
  tools_aartis: string;
  tools_choghadiya: string;
  hubs_title: string;
  hubs_desc: string;
  hub_krishna: string;
  hub_lakshmi: string;
  hub_shani: string;
  footer_brand: string;
  footer_tagline: string;
  footer_desc_1: string;
  footer_desc_2: string;
  footer_social: string;
  footer_links_label: string;
  footer_link_about: string;
  footer_link_support: string;
  footer_link_contact: string;
  footer_link_privacy: string;
  footer_link_terms: string;
  footer_link_aarti_collection: string;
  footer_link_choghadiya: string;
};

export const HOME_COPY: Record<HomeLang, HomeCopy> = {
  en: {
    hero_title: "If you could speak to God, what would you ask?",
    hero_subtitle: "Timeless wisdom, thoughtfully powered by AI.",
    featured_label: "Featured guide",
    featured_krishna_title: "Shri Krishna",
    featured_krishna_desc: "For life decisions and inner peace",
    featured_lakshmi_title: "Lakshmi Ji",
    featured_lakshmi_desc: "For money stress and steady growth",
    featured_shani_title: "Shani Dev",
    featured_shani_desc: "For tough phases and setbacks",
    trust_1_title: "Private & Secure Conversations",
    trust_1_desc: "Your chats stay confidential and are not shared publicly.",
    trust_2_title: "A Safe Space for Reflection",
    trust_2_desc: "Ask freely. Speak honestly. No judgement.",
    trust_3_title: "Proudly aligned with Digital India",
    trust_3_desc: "Built to bring sacred wisdom into the digital age.",
    rating_label: "Community rating",
    rating_value: "4.83",
    rating_desc: "by 2,500+ Users",
    stats_1_label: "Sessions delivered",
    stats_1_value: "10,000+",
    stats_2_label: "Guidance sessions",
    stats_2_value: "10,000+",
    stats_3_label: "Global reach",
    stats_3_value: "25+",
    stats_3_suffix: "Countries",
    testimonial_1: "“I come here when my mind spirals. The guidance is simple and practical.”",
    testimonial_1_meta: "Rohan M. · London",
    testimonial_2: "“I use the Krishna guide for hard decisions. It helps me act with clarity.”",
    testimonial_2_meta: "Meera K. · Toronto",
    testimonial_3: "“The Lakshmi guide gives me calm structure around money stress and gratitude.”",
    testimonial_3_meta: "Ananya P. · Mumbai",
    disclaimer_title: "A Personal Digital Darshan",
    disclaimer_desc:
      "Bhakti Chat is an AI devotional experience inspired by sacred teachings and devotional archetypes. It is not a real deity, priest, astrologer, or medical professional. Use it for reflection, clarity, and grounded spiritual practice in daily life.",
    more_tools_label: "More devotional tools:",
    tools_aartis: "Aartis",
    tools_choghadiya: "Choghadiya",
    hubs_title: "Deity knowledge hubs",
    hubs_desc: "Start here for deeper reading and long-form devotional guidance.",
    hub_krishna: "Shri Krishna hub",
    hub_lakshmi: "Lakshmi Ji hub",
    hub_shani: "Shani Dev hub",
    footer_brand: "Bhakti Chat",
    footer_tagline: "Timeless wisdom, powered by AI",
    footer_desc_1: "A calm devotional platform centered on Bhakti Chat, daily reflection, and trusted spiritual content.",
    footer_desc_2: "Bhakti Chat conversations are built for private reflection and respectful guidance.",
    footer_social: "BhaktiSagarTV · 100,000+",
    footer_links_label: "Links",
    footer_link_about: "About",
    footer_link_support: "Support",
    footer_link_contact: "Contact",
    footer_link_privacy: "Privacy Policy",
    footer_link_terms: "Terms",
    footer_link_aarti_collection: "Aarti Collection",
    footer_link_choghadiya: "Choghadiya"
  },
  hinglish: {
    hero_title: "Agar tum Bhagwan se baat kar paate, toh kya puchte?",
    hero_subtitle: "Timeless wisdom, ab AI ke saath.",
    featured_label: "Featured guide",
    featured_krishna_title: "Shri Krishna",
    featured_krishna_desc: "Life decisions aur inner peace ke liye",
    featured_lakshmi_title: "Lakshmi Ji",
    featured_lakshmi_desc: "Paise ki tension aur steady growth ke liye",
    featured_shani_title: "Shani Dev",
    featured_shani_desc: "Tough phases aur setbacks ke liye",
    trust_1_title: "Private aur Secure Chats",
    trust_1_desc: "Tumhari chats private rehti hain, public share nahi hoti.",
    trust_2_title: "Sochne ka safe space",
    trust_2_desc: "Bina jhijhak bolo. Dil khol ke bolo. Koi judgement nahi.",
    trust_3_title: "Digital India se aligned",
    trust_3_desc: "Sacred wisdom ko digital age mein laane ke liye bana hai.",
    rating_label: "Community rating",
    rating_value: "4.83",
    rating_desc: "2,500+ users ke through",
    stats_1_label: "Sessions delivered",
    stats_1_value: "10,000+",
    stats_2_label: "Guidance sessions",
    stats_2_value: "10,000+",
    stats_3_label: "Global reach",
    stats_3_value: "25+",
    stats_3_suffix: "Countries",
    testimonial_1: "“Jab mann spiral karta hai, main yahin aata hoon. Guidance simple aur practical hoti hai.”",
    testimonial_1_meta: "Rohan M. · London",
    testimonial_2: "“Hard decisions ke time main Krishna guide use karta hoon. Clarity milti hai.”",
    testimonial_2_meta: "Meera K. · Toronto",
    testimonial_3: "“Lakshmi guide se paise ki tension mein calm structure aur gratitude aata hai.”",
    testimonial_3_meta: "Ananya P. · Mumbai",
    disclaimer_title: "A Personal Digital Darshan",
    disclaimer_desc:
      "Bhakti Chat ek AI devotional experience hai jo sacred teachings aur devotional archetypes se inspired hai. Ye koi real deity, priest, astrologer ya medical professional nahi hai. Isse reflection, clarity aur daily life mein grounded practice ke liye use karo.",
    more_tools_label: "More devotional tools:",
    tools_aartis: "Aartis",
    tools_choghadiya: "Choghadiya",
    hubs_title: "Deity knowledge hubs",
    hubs_desc: "Deep reading aur long-form guidance ke liye yahan se start karo.",
    hub_krishna: "Shri Krishna hub",
    hub_lakshmi: "Lakshmi Ji hub",
    hub_shani: "Shani Dev hub",
    footer_brand: "Bhakti Chat",
    footer_tagline: "Timeless wisdom, powered by AI",
    footer_desc_1: "Bhakti Chat ek calm devotional platform hai, daily reflection aur trusted spiritual content ke saath.",
    footer_desc_2: "Yahan chats private reflection aur respectful guidance ke liye bani hain.",
    footer_social: "BhaktiSagarTV · 100,000+",
    footer_links_label: "Links",
    footer_link_about: "About",
    footer_link_support: "Support",
    footer_link_contact: "Contact",
    footer_link_privacy: "Privacy Policy",
    footer_link_terms: "Terms",
    footer_link_aarti_collection: "Aarti Collection",
    footer_link_choghadiya: "Choghadiya"
  },
  hi: {
    hero_title: "अगर आप भगवान से बात कर पाते, तो क्या पूछते?",
    hero_subtitle: "सदा का ज्ञान, अब एआई के साथ।",
    featured_label: "Featured guide",
    featured_krishna_title: "श्री कृष्ण",
    featured_krishna_desc: "जीवन के फैसलों और मन की शांति के लिए",
    featured_lakshmi_title: "लक्ष्मी जी",
    featured_lakshmi_desc: "पैसों की चिंता और स्थिर प्रगति के लिए",
    featured_shani_title: "शनि देव",
    featured_shani_desc: "कठिन दौर और झटकों के लिए",
    trust_1_title: "निजी और सुरक्षित बातचीत",
    trust_1_desc: "आपकी चैट निजी रहती है और सार्वजनिक रूप से साझा नहीं होती।",
    trust_2_title: "सोचने का सुरक्षित स्थान",
    trust_2_desc: "बेझिझक पूछें। खुलकर बात करें। कोई जजमेंट नहीं।",
    trust_3_title: "Digital India से जुड़ा",
    trust_3_desc: "पवित्र सीख को डिजिटल दौर में लाने के लिए बनाया गया है।",
    rating_label: "Community rating",
    rating_value: "4.83",
    rating_desc: "2,500+ उपयोगकर्ताओं के आधार पर",
    stats_1_label: "Sessions delivered",
    stats_1_value: "10,000+",
    stats_2_label: "Guidance sessions",
    stats_2_value: "10,000+",
    stats_3_label: "Global reach",
    stats_3_value: "25+",
    stats_3_suffix: "देश",
    testimonial_1: "“जब मन बहुत उलझ जाता है, मैं यहीं आता हूँ। सलाह सरल और काम की होती है।”",
    testimonial_1_meta: "Rohan M. · London",
    testimonial_2: "“कठिन फैसलों में मैं कृष्ण गाइड का उपयोग करती हूँ। इससे साफ सोच मिलती है।”",
    testimonial_2_meta: "Meera K. · Toronto",
    testimonial_3: "“लक्ष्मी गाइड से पैसों की चिंता में शांति और सही ढांचा मिलता है।”",
    testimonial_3_meta: "Ananya P. · Mumbai",
    disclaimer_title: "A Personal Digital Darshan",
    disclaimer_desc:
      "Bhakti Chat एक एआई अनुभव है जो पवित्र सीख और भक्ति परंपरा से प्रेरित है। यह कोई वास्तविक देवता, पुजारी, ज्योतिषी या मेडिकल प्रोफेशनल नहीं है। इसे आत्मचिंतन, स्पष्टता और रोजमर्रा की अच्छी आदतों के लिए उपयोग करें।",
    more_tools_label: "More devotional tools:",
    tools_aartis: "आरती",
    tools_choghadiya: "चौघड़िया",
    hubs_title: "देवता ज्ञान केंद्र",
    hubs_desc: "गहराई से पढ़ने और लंबे मार्गदर्शन के लिए यहां से शुरू करें।",
    hub_krishna: "श्री कृष्ण हब",
    hub_lakshmi: "लक्ष्मी जी हब",
    hub_shani: "शनि देव हब",
    footer_brand: "Bhakti Chat",
    footer_tagline: "Timeless wisdom, powered by AI",
    footer_desc_1: "Bhakti Chat एक शांत भक्ति प्लेटफॉर्म है, रोज़ के आत्मचिंतन और भरोसेमंद आध्यात्मिक सामग्री के लिए।",
    footer_desc_2: "यहां की बातचीत निजी और सम्मानजनक मार्गदर्शन के लिए बनाई गई है।",
    footer_social: "BhaktiSagarTV · 100,000+",
    footer_links_label: "Links",
    footer_link_about: "About",
    footer_link_support: "Support",
    footer_link_contact: "Contact",
    footer_link_privacy: "Privacy Policy",
    footer_link_terms: "Terms",
    footer_link_aarti_collection: "Aarti Collection",
    footer_link_choghadiya: "चौघड़िया"
  }
};
