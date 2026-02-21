export type HiSearchIntent = "informational" | "devotional" | "transactional";

export type HiKeywordCluster = {
  id: string;
  category: "core" | "krishna" | "lakshmi" | "shani" | "general";
  primaryKeyword: string;
  secondaryKeywords: string[];
  intent: HiSearchIntent;
  targetPath: string;
};

export const HI_KEYWORD_MAP: Record<
  "core" | "krishna" | "lakshmi" | "shani" | "general",
  HiKeywordCluster[]
> = {
  core: [
    {
      id: "core-krishna-chat",
      category: "core",
      primaryKeyword: "श्री कृष्ण से बात करें",
      secondaryKeywords: ["भगवान से बात करें", "ऑनलाइन भगवान से बात", "भक्ति चैट"],
      intent: "transactional",
      targetPath: "/hi/bhaktigpt/chat?guide=krishna"
    },
    {
      id: "core-lakshmi-chat",
      category: "core",
      primaryKeyword: "लक्ष्मी जी से बात करें",
      secondaryKeywords: ["ऑनलाइन भगवान से बात", "भक्ति चैट", "लक्ष्मी मार्गदर्शन"],
      intent: "transactional",
      targetPath: "/hi/bhaktigpt/chat?guide=lakshmi"
    },
    {
      id: "core-shani-chat",
      category: "core",
      primaryKeyword: "शनि देव से बात करें",
      secondaryKeywords: ["भगवान से बात करें", "ऑनलाइन भगवान से बात", "भक्ति चैट"],
      intent: "transactional",
      targetPath: "/hi/bhaktigpt/chat?guide=shani"
    },
    {
      id: "core-god-chat",
      category: "core",
      primaryKeyword: "भगवान से बात करें",
      secondaryKeywords: ["ऑनलाइन भगवान से बात", "भक्ति चैट", "श्री कृष्ण से बात करें"],
      intent: "transactional",
      targetPath: "/hi"
    }
  ],
  krishna: [
    {
      id: "krishna-hub",
      category: "krishna",
      primaryKeyword: "कृष्ण की कहानी",
      secondaryKeywords: ["गीता के उपदेश", "कृष्ण आरती", "कृष्ण भजन"],
      intent: "informational",
      targetPath: "/hi/krishna"
    },
    {
      id: "krishna-mantra",
      category: "krishna",
      primaryKeyword: "श्री कृष्ण मंत्र",
      secondaryKeywords: ["कृष्ण मंत्र जप", "मन की शांति", "भक्ति मंत्र"],
      intent: "devotional",
      targetPath: "/hi/krishna/mantra"
    },
    {
      id: "krishna-aarti",
      category: "krishna",
      primaryKeyword: "कृष्ण आरती",
      secondaryKeywords: ["आरती के बोल", "कृष्ण पूजा", "भक्ति आरती"],
      intent: "devotional",
      targetPath: "/hi/krishna/aarti"
    },
    {
      id: "krishna-chalisa",
      category: "krishna",
      primaryKeyword: "कृष्ण चालीसा",
      secondaryKeywords: ["कृष्ण चालीसा पाठ", "कृष्ण भक्ति", "आरती"],
      intent: "devotional",
      targetPath: "/hi/krishna/chalisa"
    },
    {
      id: "krishna-bhajan",
      category: "krishna",
      primaryKeyword: "कृष्ण भजन",
      secondaryKeywords: ["भजन", "कृष्ण नाम", "भक्ति संगीत"],
      intent: "devotional",
      targetPath: "/hi/krishna/bhajan"
    },
    {
      id: "krishna-gita",
      category: "krishna",
      primaryKeyword: "भगवद गीता के श्लोक",
      secondaryKeywords: ["गीता के उपदेश", "कर्म योग", "श्री कृष्ण ज्ञान"],
      intent: "informational",
      targetPath: "/hi/krishna/gita-shlok"
    },
    {
      id: "krishna-janmashtami",
      category: "krishna",
      primaryKeyword: "कृष्ण जन्माष्टमी पूजा विधि",
      secondaryKeywords: ["कृष्ण पूजा विधि", "उपवास", "कृष्ण की कहानी"],
      intent: "informational",
      targetPath: "/hi/festival/janmashtami"
    }
  ],
  lakshmi: [
    {
      id: "lakshmi-hub",
      category: "lakshmi",
      primaryKeyword: "लक्ष्मी जी की कथा",
      secondaryKeywords: ["लक्ष्मी मंत्र", "लक्ष्मी आरती", "समृद्धि के उपाय"],
      intent: "informational",
      targetPath: "/hi/lakshmi"
    },
    {
      id: "lakshmi-mantra",
      category: "lakshmi",
      primaryKeyword: "लक्ष्मी मंत्र",
      secondaryKeywords: ["धन प्राप्ति मंत्र", "लक्ष्मी जप", "समृद्धि मंत्र"],
      intent: "devotional",
      targetPath: "/hi/lakshmi/mantra"
    },
    {
      id: "lakshmi-aarti",
      category: "lakshmi",
      primaryKeyword: "लक्ष्मी आरती",
      secondaryKeywords: ["आरती के बोल", "दीवाली लक्ष्मी पूजा", "भक्ति"],
      intent: "devotional",
      targetPath: "/hi/lakshmi/aarti"
    },
    {
      id: "lakshmi-chalisa",
      category: "lakshmi",
      primaryKeyword: "लक्ष्मी चालीसा",
      secondaryKeywords: ["लक्ष्मी पाठ", "समृद्धि", "भक्ति"],
      intent: "devotional",
      targetPath: "/hi/lakshmi/chalisa"
    },
    {
      id: "lakshmi-puja-vidhi",
      category: "lakshmi",
      primaryKeyword: "लक्ष्मी पूजा विधि",
      secondaryKeywords: ["दीवाली लक्ष्मी पूजा", "समृद्धि के उपाय", "पूजा विधि"],
      intent: "informational",
      targetPath: "/hi/lakshmi/puja-vidhi"
    },
    {
      id: "lakshmi-katha",
      category: "lakshmi",
      primaryKeyword: "लक्ष्मी जी की कथा",
      secondaryKeywords: ["लक्ष्मी पूजा", "समृद्धि", "कथा"],
      intent: "informational",
      targetPath: "/hi/lakshmi/katha"
    }
  ],
  shani: [
    {
      id: "shani-hub",
      category: "shani",
      primaryKeyword: "शनिदेव के नियम",
      secondaryKeywords: ["शनि मंत्र", "शनि आरती", "साढ़ेसाती उपाय"],
      intent: "informational",
      targetPath: "/hi/shani"
    },
    {
      id: "shani-mantra",
      category: "shani",
      primaryKeyword: "शनि मंत्र",
      secondaryKeywords: ["शनि जप", "शनि दोष उपाय", "शनिवार उपाय"],
      intent: "devotional",
      targetPath: "/hi/shani/mantra"
    },
    {
      id: "shani-aarti",
      category: "shani",
      primaryKeyword: "शनि आरती",
      secondaryKeywords: ["शनिवार आरती", "आरती के बोल", "शनि पूजा"],
      intent: "devotional",
      targetPath: "/hi/shani/aarti"
    },
    {
      id: "shani-chalisa",
      category: "shani",
      primaryKeyword: "शनि चालीसा",
      secondaryKeywords: ["शनि पाठ", "शनि पूजा विधि", "शनि नियम"],
      intent: "devotional",
      targetPath: "/hi/shani/chalisa"
    },
    {
      id: "shani-vrat-katha",
      category: "shani",
      primaryKeyword: "शनिवार व्रत कथा",
      secondaryKeywords: ["व्रत कथा", "शनि देव की पूजा", "शनि दोष उपाय"],
      intent: "informational",
      targetPath: "/hi/shani/vrat-katha"
    },
    {
      id: "shani-puja-vidhi",
      category: "shani",
      primaryKeyword: "शनि पूजा विधि",
      secondaryKeywords: ["शनि दोष उपाय", "साढ़ेसाती उपाय", "शनिदेव के नियम"],
      intent: "informational",
      targetPath: "/hi/shani/puja-vidhi"
    }
  ],
  general: [
    {
      id: "general-aarti",
      category: "general",
      primaryKeyword: "आरती",
      secondaryKeywords: ["आरती के बोल", "भजन", "मंत्र"],
      intent: "informational",
      targetPath: "/hi/aartis"
    },
    {
      id: "general-bhajan",
      category: "general",
      primaryKeyword: "भजन",
      secondaryKeywords: ["कृष्ण भजन", "लक्ष्मी भजन", "भक्ति गीत"],
      intent: "informational",
      targetPath: "/hi/bhajan"
    },
    {
      id: "general-chalisa",
      category: "general",
      primaryKeyword: "चालीसा",
      secondaryKeywords: ["शनि चालीसा", "लक्ष्मी चालीसा", "कृष्ण चालीसा"],
      intent: "informational",
      targetPath: "/hi/chalisa"
    },
    {
      id: "general-mantra",
      category: "general",
      primaryKeyword: "मंत्र",
      secondaryKeywords: ["श्री कृष्ण मंत्र", "लक्ष्मी मंत्र", "शनि मंत्र"],
      intent: "informational",
      targetPath: "/hi/mantra"
    },
    {
      id: "general-stotra",
      category: "general",
      primaryKeyword: "स्तोत्र",
      secondaryKeywords: ["स्तोत्र पाठ", "भक्ति", "मंत्र"],
      intent: "informational",
      targetPath: "/hi/stotras"
    },
    {
      id: "general-pooja-vidhi",
      category: "general",
      primaryKeyword: "पूजा विधि",
      secondaryKeywords: ["लक्ष्मी पूजा विधि", "शनि पूजा विधि", "कृष्ण पूजा"],
      intent: "informational",
      targetPath: "/hi/pooja-vidhi"
    },
    {
      id: "general-vrat-katha",
      category: "general",
      primaryKeyword: "व्रत कथा",
      secondaryKeywords: ["शनिवार व्रत कथा", "व्रत नियम", "भक्ति"],
      intent: "informational",
      targetPath: "/hi/vrat-katha"
    },
    {
      id: "general-prasad",
      category: "general",
      primaryKeyword: "प्रसाद",
      secondaryKeywords: ["भोग", "पूजा", "भक्ति परंपरा"],
      intent: "informational",
      targetPath: "/hi/pooja"
    },
    {
      id: "general-aarti-bol",
      category: "general",
      primaryKeyword: "आरती के बोल",
      secondaryKeywords: ["आरती", "भजन", "देवता आरती"],
      intent: "informational",
      targetPath: "/hi/aartis"
    }
  ]
};

export const HI_KEYWORD_LIST = Object.values(HI_KEYWORD_MAP).flat();
