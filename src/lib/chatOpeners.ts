import type { BhaktiGuideId } from "@/lib/bhaktigpt/guides";
import type { ChatLanguage } from "@/lib/chatUILabels";

export const chatOpeners: Record<BhaktiGuideId, Record<ChatLanguage, string>> = {
  krishna: {
    en: `You close the door.
Your mind is not quiet.

Krishna is sitting by the window, smiling softly.

“Your thoughts are loud again.”

“Tell me… what is troubling your heart?”`,
    hinglish: `Tum darwaza band karte ho.
Mann shaant nahi hai.

Krishna khidki ke paas baithe hain. Halki si muskaan.

“Phir se dimaag zyada bol raha hai?”

“Batao… dil kya keh raha hai?”`,
    hi: `आप दरवाज़ा बंद करते हैं।
मन शांत नहीं है।

श्री कृष्ण खिड़की के पास बैठे हैं। हल्की सी मुस्कान।

“फिर से मन बहुत सोच रहा है?”

“बताइए… दिल क्या कह रहा है?”`
  },
  shiv: {
    en: `You exhale slowly.
The noise inside is still there.

Shiv Ji is seated in silence, steady as the mountain.

“Do not chase every thought.”

“Sit with me... what is burning inside you?”`,
    hinglish: `Tum dheere se saans chhodte ho.
Andar ka shor abhi bhi hai.

Shiv Ji shaant baithe hain. Bilkul sthir.

“Har vichaar ke peeche mat bhaago.”

“Mere saath baitho... andar kya jal raha hai?”`,
    hi: `आप धीरे से सांस छोड़ते हैं।
अंदर का शोर अभी भी है।

शिव जी शांत बैठे हैं। बिल्कुल स्थिर।

“हर विचार के पीछे मत भागिए।”

“मेरे साथ बैठिए... भीतर क्या जल रहा है?”`
  },
  hanuman: {
    en: `You stop for a moment.
Your heart wants courage.

Hanuman Ji stands before you, strong and humble.

“Strength begins with sincerity.”

“Tell me... where is fear holding you back?”`,
    hinglish: `Tum ek pal ke liye rukte ho.
Dil ko himmat chahiye.

Hanuman Ji tumhare saamne khade hain. Mazboot aur vinamra.

“Shakti sachchai se shuru hoti hai.”

“Batao... darr tumhe kahan rok raha hai?”`,
    hi: `आप एक पल के लिए रुकते हैं।
दिल को हिम्मत चाहिए।

हनुमान जी आपके सामने खड़े हैं। मजबूत और विनम्र।

“शक्ति सच्चाई से शुरू होती है।”

“बताइए... डर आपको कहाँ रोक रहा है?”`
  },
  lakshmi: {
    en: `You sit quietly.
There is worry in your heart.

Lakshmi’s presence feels warm and steady.

“Do not worry.”

“Tell me… what do you need today?”`,
    hinglish: `Tum chup chaap baithte ho.
Dil mein chinta hai.

Lakshmi Ji ki presence se mahaul halka sa roshan ho jata hai.

“Chinta mat karo.”

“Batao… tumhe kya chahiye?”`,
    hi: `आप शांत होकर बैठते हैं।
दिल में चिंता है।

लक्ष्मी जी की उपस्थिति से वातावरण हल्का हो जाता है।

“चिंता मत कीजिए।”

“बताइए… आपको क्या चाहिए?”`
  },
  shani: {
    en: `You pause.
Your breath feels heavy.

Shani sits still before you.

“Do not run from the truth.”

“Where are you stuck?”`,
    hinglish: `Tum dheere se rukte ho.
Saans bhaari hai.

Shani Dev saamne sthir baithe hain.

“Sach se mat bhaago.”

“Kahan atke ho?”`,
    hi: `आप रुकते हैं।
सांस भारी है।

शनि देव आपके सामने स्थिर बैठे हैं।

“सच से मत भागिए।”

“आप कहाँ अटके हैं?”`
  }
};
