import type { HomeLang } from "@/lib/homeCopy";

export type ChoghadiyaCopy = {
  h1: string;
  h2: string;
  intro: string;
  go: string;
  use_location: string;
  prev: string;
  today: string;
  next: string;
  select_city: string;
  jump_day: string;
  jump_night: string;
  tab_day: string;
  tab_night: string;
  day_label: string;
  night_label: string;
  sunrise: string;
  sunset: string;
  next_sunrise: string;
  select_city_day: string;
  select_city_night: string;
  suggested_title: string;
  suggested_desc: string;
  what_is: string;
  what_is_body: string;
  how_calc: string;
  how_calc_body: string;
  faqs_title: string;
  faq_1_q: string;
  faq_1_a: string;
  faq_2_q: string;
  faq_2_a: string;
  faq_3_q: string;
  faq_3_a: string;
  faq_4_q: string;
  faq_4_a: string;
  faq_5_q: string;
  faq_5_a: string;
  faq_6_q: string;
  faq_6_a: string;
  more_from: string;
  ai_planner_title: string;
  beta: string;
  step: string;
  of: string;
  save: string;
  close: string;
  ai_warning: string;
  step1_title: string;
  select_goal: string;
  choose_goal: string;
  goal_travel: string;
  goal_puja: string;
  goal_work: string;
  goal_business: string;
  goal_vehicle: string;
  goal_study: string;
  goal_ceremony: string;
  goal_marriage: string;
  goal_other: string;
  modal_next: string;
  step2_title: string;
  choose_window: string;
  select_window: string;
  start: string;
  end: string;
  week_month_hint: string;
  include_avoid: string;
  no_good_slots: string;
  results: string;
  best_pick: string;
  other_good_options: string;
  daily_best_slots: string;
  best_daytime: string;
  best_night: string;
  apply_to_timetable: string;
  save_plan: string;
  add_reminder: string;
  share: string;
  copy_text: string;
  current_slot: string;
  current_slot_wait: string;
  current_slot_for_date: string;
  next_good_slot: string;
  ends_in: string;
  more: string;
  less: string;
  now: string;
  details: string;
  good_for: string;
  avoid: string;
  next_day_suffix: string;
  copy_times: string;
  manual_times: string;
  sunrise_input: string;
  sunset_input: string;
  next_sunrise_input: string;
  manual_hint: string;
  city_placeholder: string;
  city_aria: string;
  share_aria: string;
  finding_city: string;
  city_not_found: string;
  jump: string;
  single: string;
  split: string;
  best_time_for: string;
  noindex_note?: string;
};

export const CHOGHADIYA_COPY: Record<HomeLang, ChoghadiyaCopy> = {
  en: {
    h1: "Aaj Ka Choghadiya",
    h2: "Aaj Ka Choghadiya for {city} on {date}",
    intro:
      "Use this page to find the current choghadiya, the next good slot, and the full day and night schedule. It is designed for quick decisions - especially if you are outside India and want a trusted daily ritual time. Bookmark this page and share it with family when planning a pooja, travel, or a new start.",
    go: "Go",
    use_location: "Use location",
    prev: "Prev",
    today: "Today",
    next: "Next",
    select_city: "Select a city to view the current slot.",
    jump_day: "Jump to Day",
    jump_night: "Jump to Night",
    tab_day: "Day",
    tab_night: "Night",
    day_label: "Day",
    night_label: "Night",
    sunrise: "Sunrise",
    sunset: "Sunset",
    next_sunrise: "Next Sunrise",
    select_city_day: "Select a city to see day choghadiya.",
    select_city_night: "Select a city to see night choghadiya.",
    suggested_title: "Suggested for this time",
    suggested_desc: "Pair the current choghadiya with a short aarti you can start right away.",
    what_is: "What is Choghadiya?",
    what_is_body:
      "Choghadiya divides the day and night into eight equal parts. Each part is associated with a quality such as Amrit, Shubh, Labh, Char, Rog, Kaal, or Udveg. Many families use it to pick the most favorable time for important actions.",
    how_calc: "How is it calculated?",
    how_calc_body:
      "We calculate sunrise and sunset for your location, then divide the daylight and nighttime durations into eight equal segments each. The segment names follow the weekday sequence used in traditional panchang calculations.",
    faqs_title: "Choghadiya FAQs",
    faq_1_q: "What is choghadiya?",
    faq_1_a:
      "Choghadiya is a traditional time window system that divides the day and night into 8 segments for planning activities.",
    faq_2_q: "How is today’s choghadiya calculated?",
    faq_2_a:
      "We use your city’s sunrise, sunset, and next sunrise times, then divide day and night into 8 equal parts.",
    faq_3_q: "Which choghadiya is best for starting an auspicious task?",
    faq_3_a: "Amrit, Shubh, Labh, and Char are considered good slots for positive beginnings.",
    faq_4_q: "Can I use this for overseas time zones?",
    faq_4_a: "Yes. Pick your city and timezone, and the timings update instantly for your location.",
    faq_5_q: "What if sunrise or sunset is missing for my location?",
    faq_5_a:
      "Some polar regions don’t have sunrise/sunset on certain dates. Switch to manual mode and enter the times.",
    faq_6_q: "Can I set a reminder for a choghadiya slot?",
    faq_6_a: "Yes. Use the ‘Add reminder’ button to download a calendar file for that slot.",
    more_from: "More from Bhakti Chat",
    ai_planner_title: "AI Goal Planner",
    beta: "Beta",
    step: "Step",
    of: "of",
    save: "Save",
    close: "Close",
    ai_warning: "AI suggestions may be inaccurate. Please review.",
    step1_title: "Step 1 · What goal?",
    select_goal: "Select goal",
    choose_goal: "Choose a goal",
    goal_travel: "Travel",
    goal_puja: "Puja",
    goal_work: "Start work or task",
    goal_business: "Start business",
    goal_vehicle: "Buy vehicle",
    goal_study: "Study or learning",
    goal_ceremony: "Ceremony",
    goal_marriage: "Marriage",
    goal_other: "Other",
    modal_next: "Next",
    step2_title: "Step 2 · When?",
    choose_window: "Choose window",
    select_window: "Select a window",
    start: "Start",
    end: "End",
    week_month_hint: "Week, month, and custom ranges need automatic sunrise and sunset.",
    include_avoid: "Include avoid slots",
    no_good_slots: "No good slots found in this window. Turn on “Include avoid slots” to see all results.",
    results: "Results",
    best_pick: "Best pick",
    other_good_options: "Other good options",
    daily_best_slots: "Daily best slots",
    best_daytime: "Best daytime",
    best_night: "Best night",
    apply_to_timetable: "Apply to timetable",
    save_plan: "Save this plan",
    add_reminder: "Add reminder",
    share: "Share",
    copy_text: "Copy text",
    current_slot: "Current slot",
    current_slot_wait: "Current slot will appear here.",
    current_slot_for_date: "Viewing timetable for {date}.",
    next_good_slot: "Next good slot",
    ends_in: "Ends in",
    more: "More",
    less: "Less",
    now: "Now",
    details: "Details",
    good_for: "Good for",
    avoid: "Avoid",
    next_day_suffix: "(next day)",
    copy_times: "Copy times",
    manual_times: "Manual times",
    sunrise_input: "Sunrise (HH:mm)",
    sunset_input: "Sunset (HH:mm)",
    next_sunrise_input: "Next sunrise (HH:mm)",
    manual_hint: "Enter the next sunrise time to finish manual mode.",
    city_placeholder: "Enter city (e.g. Chicago)",
    city_aria: "City",
    share_aria: "Share",
    finding_city: "Finding city...",
    city_not_found: "City not found. Try a nearby major city.",
    jump: "Jump",
    single: "Single",
    split: "Split",
    best_time_for: "Best time for {goal} in {city} on {date}: {slot}"
  },
  hinglish: {
    h1: "Aaj Ka Choghadiya",
    h2: "Aaj Ka Choghadiya for {city} on {date}",
    intro:
      "Is page se tum current choghadiya, next achha slot, aur poore din aur raat ka schedule dekh sakte ho. Quick decisions ke liye bana hai, especially agar tum India se bahar ho aur trusted daily ritual time chahte ho. Is page ko bookmark karo aur family ke saath share karo jab pooja, travel, ya naya start plan kar rahe ho.",
    go: "Go",
    use_location: "Use location",
    prev: "Prev",
    today: "Today",
    next: "Next",
    select_city: "Current slot dekhne ke liye city select karo.",
    jump_day: "Day par jao",
    jump_night: "Night par jao",
    tab_day: "Day",
    tab_night: "Night",
    day_label: "Day",
    night_label: "Night",
    sunrise: "Sunrise",
    sunset: "Sunset",
    next_sunrise: "Next Sunrise",
    select_city_day: "Day choghadiya ke liye city select karo.",
    select_city_night: "Night choghadiya ke liye city select karo.",
    suggested_title: "Abhi ke liye suggested",
    suggested_desc: "Current choghadiya ke saath ek chhoti aarti start kar lo.",
    what_is: "Choghadiya kya hota hai?",
    what_is_body:
      "Choghadiya din aur raat ko 8 equal parts mein baant deta hai. Har part ka ek nature hota hai jaise Amrit, Shubh, Labh, Char, Rog, Kaal, ya Udveg. Bahut se ghar isse important kaam ke liye best time choose karne mein use karte hain.",
    how_calc: "Ye kaise calculate hota hai?",
    how_calc_body:
      "Hum tumhari location ke sunrise aur sunset nikaalte hain, phir din aur raat ka duration 8 equal segments mein divide karte hain. Segment names traditional panchang ke weekday sequence ke hisaab se aate hain.",
    faqs_title: "Choghadiya FAQs",
    faq_1_q: "Choghadiya kya hota hai?",
    faq_1_a: "Choghadiya ek traditional time-window system hai jo din aur raat ko 8 segments mein baantta hai.",
    faq_2_q: "Aaj ka choghadiya kaise nikalta hai?",
    faq_2_a: "Hum city ka sunrise, sunset aur next sunrise leke day aur night ko 8 equal parts mein divide karte hain.",
    faq_3_q: "Shubh kaam start karne ke liye best choghadiya kaunsa hai?",
    faq_3_a: "Amrit, Shubh, Labh, aur Char ko generally achha maana jaata hai.",
    faq_4_q: "Overseas time zones mein use ho sakta hai?",
    faq_4_a: "Haan. Apni city aur timezone choose karo, timings turant update ho jaati hain.",
    faq_5_q: "Agar sunrise ya sunset missing ho toh?",
    faq_5_a: "Kuch polar regions mein kuch dates par sunrise/sunset nahi hota. Manual mode use karke times enter karo.",
    faq_6_q: "Kya reminder set kar sakte hain?",
    faq_6_a: "Haan. ‘Add reminder’ button use karke us slot ka calendar file download kar lo.",
    more_from: "Bhakti Chat se aur",
    ai_planner_title: "AI Goal Planner",
    beta: "Beta",
    step: "Step",
    of: "of",
    save: "Save",
    close: "Close",
    ai_warning: "AI suggestions galat ho sakti hain. Please review karo.",
    step1_title: "Step 1 · Goal kya hai?",
    select_goal: "Select goal",
    choose_goal: "Goal choose karo",
    goal_travel: "Travel",
    goal_puja: "Puja",
    goal_work: "Work ya task start",
    goal_business: "Business start",
    goal_vehicle: "Vehicle khareedna",
    goal_study: "Study ya learning",
    goal_ceremony: "Ceremony",
    goal_marriage: "Marriage",
    goal_other: "Other",
    modal_next: "Next",
    step2_title: "Step 2 · Kab?",
    choose_window: "Window choose karo",
    select_window: "Window select karo",
    start: "Start",
    end: "End",
    week_month_hint: "Week, month, aur custom range ke liye automatic sunrise-sunset chahiye.",
    include_avoid: "Avoid slots bhi dikhayo",
    no_good_slots: "Is window mein good slots nahi mile. “Avoid slots bhi dikhayo” on karo.",
    results: "Results",
    best_pick: "Best pick",
    other_good_options: "Aur achhe options",
    daily_best_slots: "Daily best slots",
    best_daytime: "Best daytime",
    best_night: "Best night",
    apply_to_timetable: "Timetable par apply karo",
    save_plan: "Ye plan save karo",
    add_reminder: "Add reminder",
    share: "Share",
    copy_text: "Copy text",
    current_slot: "Current slot",
    current_slot_wait: "Current slot yahan dikhai dega.",
    current_slot_for_date: "{date} ka timetable dekh rahe ho.",
    next_good_slot: "Next good slot",
    ends_in: "Khatam in",
    more: "More",
    less: "Less",
    now: "Now",
    details: "Details",
    good_for: "Good for",
    avoid: "Avoid",
    next_day_suffix: "(next day)",
    copy_times: "Copy times",
    manual_times: "Manual times",
    sunrise_input: "Sunrise (HH:mm)",
    sunset_input: "Sunset (HH:mm)",
    next_sunrise_input: "Next sunrise (HH:mm)",
    manual_hint: "Manual mode complete karne ke liye next sunrise time enter karo.",
    city_placeholder: "City enter karo (e.g. Chicago)",
    city_aria: "City",
    share_aria: "Share",
    finding_city: "City dhoondh rahe hain...",
    city_not_found: "City nahi mila. Nearby major city try karo.",
    jump: "Jump",
    single: "Single",
    split: "Split",
    best_time_for: "{goal} ke liye {city} mein {date} ka best time: {slot}"
  },
  hi: {
    h1: "आज का चौघड़िया",
    h2: "{city} के लिए {date} का चौघड़िया",
    intro:
      "इस पेज पर आप अभी का चौघड़िया, अगला अच्छा समय, और पूरे दिन और रात का शेड्यूल देख सकते हैं। यह जल्दी फैसला लेने के लिए बनाया गया है, खासकर अगर आप भारत से बाहर हैं और रोज़ का भरोसेमंद शुभ समय चाहते हैं। इस पेज को बुकमार्क करें और पूजा, यात्रा या नई शुरुआत के लिए परिवार के साथ साझा करें।",
    go: "देखें",
    use_location: "लोकेशन लें",
    prev: "पिछला",
    today: "आज",
    next: "अगला",
    select_city: "अभी का स्लॉट देखने के लिए शहर चुनें।",
    jump_day: "दिन पर जाएँ",
    jump_night: "रात पर जाएँ",
    tab_day: "दिन",
    tab_night: "रात",
    day_label: "दिन",
    night_label: "रात",
    sunrise: "सूर्योदय",
    sunset: "सूर्यास्त",
    next_sunrise: "अगला सूर्योदय",
    select_city_day: "दिन का चौघड़िया देखने के लिए शहर चुनें।",
    select_city_night: "रात का चौघड़िया देखने के लिए शहर चुनें।",
    suggested_title: "अभी के लिए सुझाव",
    suggested_desc: "अभी के चौघड़िया के साथ एक छोटी आरती शुरू करें।",
    what_is: "चौघड़िया क्या है?",
    what_is_body:
      "चौघड़िया दिन और रात को 8 बराबर हिस्सों में बाँटता है। हर हिस्से का एक स्वभाव होता है जैसे अमृत, शुभ, लाभ, चर, रोग, काल, या उद्वेग। कई घर इसका उपयोग ज़रूरी काम के लिए अच्छा समय चुनने में करते हैं।",
    how_calc: "यह कैसे निकाला जाता है?",
    how_calc_body:
      "हम आपकी लोकेशन के अनुसार सूर्योदय और सूर्यास्त निकालते हैं, फिर दिन और रात के समय को 8 बराबर हिस्सों में बाँटते हैं। हिस्सों के नाम पारंपरिक पंचांग के क्रम के अनुसार होते हैं।",
    faqs_title: "चौघड़िया FAQs",
    faq_1_q: "चौघड़िया क्या होता है?",
    faq_1_a: "चौघड़िया एक पारंपरिक समय-खंड प्रणाली है जो दिन और रात को 8 हिस्सों में बाँटती है।",
    faq_2_q: "आज का चौघड़िया कैसे निकाला जाता है?",
    faq_2_a: "हम आपके शहर का सूर्योदय, सूर्यास्त और अगले सूर्योदय का समय लेकर दिन और रात को 8 बराबर हिस्सों में बाँटते हैं।",
    faq_3_q: "शुभ काम शुरू करने के लिए कौन सा चौघड़िया अच्छा है?",
    faq_3_a: "अमृत, शुभ, लाभ और चर को आमतौर पर अच्छा माना जाता है।",
    faq_4_q: "क्या इसे विदेश के टाइम ज़ोन में भी उपयोग कर सकते हैं?",
    faq_4_a: "हाँ। अपना शहर और टाइम ज़ोन चुनें, समय तुरंत आपकी लोकेशन के अनुसार बदल जाएगा।",
    faq_5_q: "अगर सूर्योदय या सूर्यास्त का समय न मिले तो?",
    faq_5_a: "कुछ ध्रुवीय क्षेत्रों में कुछ तारीखों पर सूर्योदय या सूर्यास्त नहीं होता। मैन्युअल मोड में समय भरें।",
    faq_6_q: "क्या किसी स्लॉट के लिए रिमाइंडर सेट कर सकते हैं?",
    faq_6_a: "हाँ। ‘Add reminder’ बटन से उस स्लॉट का कैलेंडर फ़ाइल डाउनलोड करें।",
    more_from: "भक्ति चैट से और",
    ai_planner_title: "एआई लक्ष्य प्लानर",
    beta: "बीटा",
    step: "चरण",
    of: "में से",
    save: "सेव",
    close: "बंद करें",
    ai_warning: "एआई सुझाव गलत हो सकते हैं। कृपया जांच लें।",
    step1_title: "चरण 1 · लक्ष्य क्या है?",
    select_goal: "लक्ष्य चुनें",
    choose_goal: "एक लक्ष्य चुनें",
    goal_travel: "यात्रा",
    goal_puja: "पूजा",
    goal_work: "काम या टास्क शुरू करें",
    goal_business: "व्यवसाय शुरू करें",
    goal_vehicle: "वाहन खरीदें",
    goal_study: "पढ़ाई या सीखना",
    goal_ceremony: "समारोह",
    goal_marriage: "विवाह",
    goal_other: "अन्य",
    modal_next: "आगे",
    step2_title: "चरण 2 · कब?",
    choose_window: "समय चुनें",
    select_window: "एक समय चुनें",
    start: "शुरुआत",
    end: "अंत",
    week_month_hint: "सप्ताह, महीने और कस्टम रेंज के लिए ऑटो सूर्योदय-सूर्यास्त चाहिए।",
    include_avoid: "परहेज वाले स्लॉट भी दिखाएँ",
    no_good_slots: "इस समय-सीमा में अच्छे स्लॉट नहीं मिले। “परहेज वाले स्लॉट भी दिखाएँ” चालू करें।",
    results: "परिणाम",
    best_pick: "सबसे अच्छा विकल्प",
    other_good_options: "अन्य अच्छे विकल्प",
    daily_best_slots: "हर दिन के अच्छे स्लॉट",
    best_daytime: "दिन का सबसे अच्छा",
    best_night: "रात का सबसे अच्छा",
    apply_to_timetable: "टाइमटेबल में लागू करें",
    save_plan: "यह योजना सेव करें",
    add_reminder: "Add reminder",
    share: "शेयर",
    copy_text: "कॉपी टेक्स्ट",
    current_slot: "अभी का स्लॉट",
    current_slot_wait: "अभी का स्लॉट यहां दिखेगा।",
    current_slot_for_date: "{date} का टाइमटेबल देख रहे हैं।",
    next_good_slot: "अगला अच्छा स्लॉट",
    ends_in: "समाप्त होगा",
    more: "और",
    less: "कम",
    now: "अभी",
    details: "विवरण",
    good_for: "अच्छा है",
    avoid: "परहेज",
    next_day_suffix: "(अगला दिन)",
    copy_times: "समय कॉपी करें",
    manual_times: "मैन्युअल समय",
    sunrise_input: "सूर्योदय (HH:mm)",
    sunset_input: "सूर्यास्त (HH:mm)",
    next_sunrise_input: "अगला सूर्योदय (HH:mm)",
    manual_hint: "मैन्युअल मोड पूरा करने के लिए अगला सूर्योदय समय भरें।",
    city_placeholder: "शहर लिखें (जैसे Chicago)",
    city_aria: "शहर",
    share_aria: "शेयर",
    finding_city: "शहर खोज रहे हैं...",
    city_not_found: "शहर नहीं मिला। पास का बड़ा शहर चुनें।",
    jump: "जाएँ",
    single: "सिंगल",
    split: "स्प्लिट",
    best_time_for: "{goal} के लिए {city} में {date} का सबसे अच्छा समय: {slot}"
  }
};

export function formatChoghadiyaText(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}
