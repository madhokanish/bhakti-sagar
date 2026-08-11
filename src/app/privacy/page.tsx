import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateMetadata(): Metadata {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title: lang === "hi" ? "प्राइवेसी पॉलिसी" : "Privacy Policy",
    description:
      lang === "hi"
        ? "जानें कि भक्ति चैट आपकी जानकारी को कैसे सुरक्षित रखता है और कैसे उपयोग करता है।"
        : "Learn how Bhakti Chat collects, uses, and protects your information.",
    pathname: `${localePrefix}/privacy`
  });
}

export default function PrivacyPage() {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const isHindi = lang === "hi";

  const copy = isHindi
    ? {
        label: "प्राइवेसी",
        title: "प्राइवेसी पॉलिसी",
        updated: "अंतिम अपडेट: 26 जुलाई 2026",
        intro:
          "यह पॉलिसी बताती है कि भक्ति चैट आपकी जानकारी कैसे एकत्र करता है, कैसे उपयोग करता है और कैसे सुरक्षित रखता है।",
        sections: [
          {
            title: "1. हम क्या जानकारी लेते हैं",
            body:
              "हम अकाउंट जानकारी (जैसे नाम और ईमेल), उपयोग जानकारी (जैसे कौन से पेज देखे), और तकनीकी जानकारी (जैसे डिवाइस, ब्राउज़र, IP) ले सकते हैं।"
          },
          {
            title: "2. जानकारी का उपयोग कैसे होता है",
            body:
              "यह जानकारी सेवा चलाने, अनुभव बेहतर करने, सुरक्षा बनाए रखने, सहायता देने और जरूरी अपडेट भेजने के लिए उपयोग होती है।"
          },
          {
            title: "3. AI प्रोसेसिंग और जानकारी की साझेदारी",
            body:
              "भक्ति चैट अपने उत्तर बनाने के लिए आर्टिफिशियल इंटेलिजेंस (AI) का उपयोग करता है। चैट उत्तर और Divine Image बनाने के लिए, आपके भेजे गए संदेशों का टेक्स्ट और आपकी चुनी गई कोई भी फ़ोटो हमारे AI प्रदाता OpenAI, L.L.C. (https://openai.com) को भेजी जाती है, जो इन्हें केवल उत्तर बनाने के लिए प्रोसेस करता है। यदि आप किसी गाइड के साथ वॉइस कॉल (बोलकर बातचीत) का उपयोग करते हैं, तो आपकी आवाज़ का ऑडियो भी इसी तरह केवल उत्तर तैयार करने के लिए OpenAI को भेजा जाता है। OpenAI अपने API से भेजे गए डेटा (टेक्स्ट, फ़ोटो या ऑडियो) का उपयोग अपने मॉडल को ट्रेन करने के लिए नहीं करता। इसके अलावा, हम आपका व्यक्तिगत डेटा नहीं बेचते। सीमित जानकारी विश्वसनीय सेवा प्रदाताओं (होस्टिंग, लॉगिन, पेमेंट, एनालिटिक्स) के साथ साझा हो सकती है। ये सभी प्रदाता आपके डेटा की सुरक्षा के लिए इस पॉलिसी के समान सुरक्षा उपाय अपनाने के लिए बाध्य हैं।"
          },
          {
            title: "4. डेटा कितने समय तक रखा जाता है",
            body:
              "डेटा उतने समय तक रखा जाता है जितना सेवा, सुरक्षा, कानूनी ज़रूरतों और विवाद समाधान के लिए आवश्यक हो।"
          },
          {
            title: "5. आपके अधिकार",
            body:
              "आप ऐप के अंदर से ही किसी भी समय अपना अकाउंट और सभी जुड़ा डेटा हटा सकते हैं: Account (प्रोफ़ाइल आइकन) → Delete account पर जाएं। इससे आपके BhaktiChat सत्र बंद हो जाते हैं और आपकी बातचीत, सेव की गई जानकारी व प्राथमिकताएं हमारे सर्वर और आपकी डिवाइस से स्थायी रूप से हट जाती हैं। आपका Google अकाउंट नहीं हटता। इसके अलावा, आप support@bhaktichat.com पर लिखकर भी अपनी जानकारी देखने, सुधारने या हटाने का अनुरोध कर सकते हैं।"
          },
          {
            title: "6. सुरक्षा",
            body:
              "हम तकनीकी और संगठनात्मक सुरक्षा उपाय अपनाते हैं। कोई भी ऑनलाइन प्रणाली 100% सुरक्षित नहीं होती, इसलिए हम सुरक्षा को लगातार बेहतर करते रहते हैं।"
          },
          {
            title: "7. बच्चों की प्राइवेसी",
            body:
              "13 वर्ष से कम उम्र के बच्चों के लिए यह सेवा अभिभावक मार्गदर्शन के बिना नहीं है। गलत डेटा मिलने पर कृपया हमें लिखें।"
          },
          {
            title: "8. इस पॉलिसी में बदलाव",
            body:
              "हम समय-समय पर इस पॉलिसी को अपडेट कर सकते हैं। बदलाव होने पर इस पेज पर नई तारीख दिखाई जाएगी।"
          }
        ],
        contactTitle: "9. संपर्क",
        contactBody: "प्राइवेसी या सपोर्ट से जुड़े सवालों के लिए support@bhaktichat.com पर लिखें।",
        home: "होम",
        page: "प्राइवेसी"
      }
    : {
        label: "Privacy",
        title: "Privacy Policy",
        updated: "Last updated: July 26, 2026",
        intro:
          "This policy explains how Bhakti Chat collects, uses, and protects your information when you use our services.",
        sections: [
          {
            title: "1. Information we collect",
            body:
              "We may collect account details (such as name and email), usage details (such as pages visited), and technical details (such as browser, device, and IP address)."
          },
          {
            title: "2. How we use information",
            body:
              "We use data to operate and improve Bhakti Chat, protect platform security, provide support, process transactions, and send important service updates."
          },
          {
            title: "3. AI processing and third-party sharing",
            body:
              "Bhakti Chat uses artificial intelligence to generate its responses. To create chat replies and Divine Image results, the text of the messages you send and any photo you choose to add are transmitted to our AI provider, OpenAI, L.L.C. (https://openai.com), which processes them solely to generate and return a response. If you use Voice Mode to speak with a guide, the audio of your voice is likewise transmitted to OpenAI solely to generate a spoken response. OpenAI does not use data submitted through its API, text, photos, or voice audio, to train its models. Beyond this, we do not sell personal data. Limited information may also be shared with trusted service providers for hosting, authentication, payments, and analytics, or when legally required. All such providers are contractually required to protect your data with safeguards equivalent to those described in this policy."
          },
          {
            title: "4. Data retention",
            body:
              "We retain data only as long as needed for service delivery, legal obligations, dispute handling, and security operations."
          },
          {
            title: "5. Your rights",
            body:
              "You can delete your account and associated data at any time directly in the app: go to Account (profile icon) → Delete account. This closes your BhaktiChat sessions and permanently deletes conversations, saved items, and preferences from our servers and your device. It does not delete your Google Account. You may also request access, correction, or deletion of your personal data by contacting us at support@bhaktichat.com."
          },
          {
            title: "6. Security",
            body:
              "We use reasonable technical and organizational safeguards. No online system is fully risk-free, and we continuously improve protections."
          },
          {
            title: "7. Children's privacy",
            body:
              "Bhakti Chat is not intended for children under 13 without parental guidance. If you believe a child submitted data, contact us for review."
          },
          {
            title: "8. Policy updates",
            body:
              "We may update this policy from time to time. Any changes will be reflected by the updated date on this page."
          }
        ],
        contactTitle: "9. Contact",
        contactBody: "For privacy or support questions, please write to support@bhaktichat.com.",
        home: "Home",
        page: "Privacy"
      };

  return (
    <div className="container py-12">
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-sagar-rose">{copy.label}</p>
      <h1 className="mt-2 text-4xl font-serif text-sagar-ink">{copy.title}</h1>
      <p className="mt-3 text-sm font-medium text-sagar-ink/70">{copy.updated}</p>
      <p className="mt-2 max-w-3xl text-sm text-sagar-ink/70">{copy.intro}</p>

      <div className="mt-8 space-y-6 text-sm leading-7 text-sagar-ink/80">
        {copy.sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-semibold text-sagar-ink">{section.title}</h2>
          <p className="mt-2">{section.body}</p>
          {section.title.startsWith("5.") ? (
            <p className="mt-2">
              <Link href="/delete-account" className="font-semibold underline underline-offset-2">
                {isHindi ? "अकाउंट हटाने का अनुरोध करें" : "Request account deletion"}
              </Link>
            </p>
          ) : null}
        </section>
        ))}

        <section>
          <h2 className="text-base font-semibold text-sagar-ink">{copy.contactTitle}</h2>
          <p className="mt-2">{copy.contactBody}</p>
        </section>
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: copy.home, url: `https://bhaktichat.com${localePrefix}` },
              { name: copy.page, url: `https://bhaktichat.com${localePrefix}/privacy` }
            ])
          )
        }}
      />
    </div>
  );
}
