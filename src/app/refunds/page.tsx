import type { Metadata } from "next";
import { buildMetadata, getRequestLanguage } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/schema";

export function generateMetadata(): Metadata {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  return buildMetadata({
    title: lang === "hi" ? "रिफंड और रद्दीकरण नीति" : "Refund and Cancellation Policy",
    description:
      lang === "hi"
        ? "जानें कि भक्ति चैट सदस्यता को कैसे रद्द करें और रिफंड कैसे काम करता है।"
        : "How to cancel your Bhakti Chat membership and how refunds are handled.",
    pathname: `${localePrefix}/refunds`
  });
}

export default function RefundsPage() {
  const lang = getRequestLanguage();
  const localePrefix = lang === "hi" ? "/hi" : "/en";
  const isHindi = lang === "hi";

  const copy = isHindi
    ? {
        label: "रिफंड",
        title: "रिफंड और रद्दीकरण नीति",
        updated: "अंतिम अपडेट: 3 अगस्त 2026",
        intro:
          "यह नीति बताती है कि Bhakti Chat सदस्यता (Membership) की बिलिंग, रद्दीकरण और रिफंड कैसे काम करते हैं।",
        sections: [
          {
            title: "1. सदस्यता और ट्रायल",
            body:
              "Bhakti Chat Membership 3 दिन के ट्रायल के साथ शुरू होती है। मैंडेट (ऑटो-पे) सत्यापित करने के लिए शुरू में ₹5 का शुल्क लिया जाता है, जो अपने आप वापस कर दिया जाता है। ट्रायल के बाद, जब तक आप रद्द नहीं करते, सदस्यता स्वतः हर महीने ₹199 पर रिन्यू होती रहती है। भुगतान UPI AutoPay या कार्ड के ज़रिए ऑटो-पे मैंडेट से लिया जाता है।"
          },
          {
            title: "2. रद्दीकरण",
            body:
              "आप अपनी सदस्यता कभी भी रद्द कर सकते हैं, अपने अकाउंट की बिलिंग सेटिंग से, या UPI AutoPay मैंडेट के लिए सीधे अपने UPI ऐप से मैंडेट रद्द करके। अगली बिलिंग तारीख से पहले रद्द करने पर आपसे आगे कोई शुल्क नहीं लिया जाएगा। रद्द करने के बाद भी आपकी सदस्यता तब तक सक्रिय रहती है जब तक चालू भुगतान अवधि समाप्त नहीं हो जाती।"
          },
          {
            title: "3. रिफंड",
            body:
              "मैंडेट सत्यापन वाला ₹5 का शुल्क अपने आप पूरी तरह वापस कर दिया जाता है, इसके लिए कोई अनुरोध करने की आवश्यकता नहीं है। मासिक ₹199 शुल्क सामान्यतः गैर-वापसी योग्य (non-refundable) है, जिसमें आंशिक रूप से उपयोग किया गया बिलिंग पीरियड शामिल है, रद्द करने पर उस अवधि के बचे हुए दिनों का आंशिक रिफंड नहीं दिया जाता। यदि आपको गलत या डुप्लीकेट (duplicate) शुल्क दिखाई देता है, तो कृपया हमसे संपर्क करें; सत्यापन के बाद ऐसे शुल्क को पूरी तरह रिफंड किया जाएगा।"
          },
          {
            title: "4. भुगतान विफलता",
            body:
              "यदि रिन्यूअल भुगतान विफल हो जाता है (जैसे मैंडेट रद्द होना, अपर्याप्त बैलेंस), तो आपकी सदस्यता निलंबित हो सकती है जब तक भुगतान सफलतापूर्वक पूरा नहीं होता।"
          },
          {
            title: "5. रिफंड का अनुरोध कैसे करें",
            body:
              "रिफंड, बिलिंग त्रुटि, या रद्दीकरण से जुड़ी किसी भी समस्या के लिए support@bhaktichat.com पर लिखें। हम आम तौर पर 3–5 कार्यदिवसों में जवाब देते हैं।"
          }
        ],
        home: "होम",
        page: "रिफंड"
      }
    : {
        label: "Refunds",
        title: "Refund and Cancellation Policy",
        updated: "Last updated: August 3, 2026",
        intro:
          "This policy explains how billing, cancellation, and refunds work for Bhakti Chat Membership.",
        sections: [
          {
            title: "1. Subscription and trial",
            body:
              "Bhakti Chat Membership starts with a 3-day trial. To verify your auto-pay mandate, an initial ₹5 authentication charge is made and is automatically refunded. Unless you cancel, the subscription then automatically renews at ₹199 per month. Payment is collected via an auto-pay mandate, using UPI AutoPay or card, depending on the payment method you choose."
          },
          {
            title: "2. Cancellation",
            body:
              "You can cancel your subscription at any time, from your account's billing settings, or, for UPI AutoPay subscriptions, directly by canceling the mandate in your UPI app. If you cancel before your next billing date, you will not be charged again. Your membership stays active until the end of the period you already paid for."
          },
          {
            title: "3. Refunds",
            body:
              "The ₹5 mandate authentication charge is refunded in full automatically, you do not need to request it. The monthly ₹199 charge is generally non-refundable, including for the unused portion of a billing period after cancellation, we do not prorate or refund partial periods. If you notice an incorrect or duplicate charge, please contact us; once verified, such charges will be refunded in full."
          },
          {
            title: "4. Failed payments",
            body:
              "If a renewal payment fails (for example, a cancelled mandate or insufficient balance), your membership may be paused until payment is successfully completed."
          },
          {
            title: "5. How to request a refund",
            body:
              "For refunds, billing errors, or cancellation issues, write to support@bhaktichat.com. We typically respond within 3–5 business days."
          }
        ],
        home: "Home",
        page: "Refunds"
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
          </section>
        ))}
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            breadcrumbJsonLd([
              { name: copy.home, url: `https://bhaktichat.com${localePrefix}` },
              { name: copy.page, url: `https://bhaktichat.com${localePrefix}/refunds` }
            ])
          )
        }}
      />
    </div>
  );
}
