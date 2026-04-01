import type { BhaktiGuideId } from "@/lib/bhaktigpt/guides";

export type HomeQuickStarter = {
  label: string;
  guideId: BhaktiGuideId;
  prompt: string;
};

export type HomePopularPrompt = {
  title: string;
  prompt: string;
  guideId: BhaktiGuideId;
};

export const HOMEPAGE_FEATURE_FLAGS = {
  recommendedRail: false
} as const;

export const HOMEPAGE_TRUST_CONFIG = {
  trustedDevotees: process.env.NEXT_PUBLIC_TRUSTED_DEVOTEES?.trim() || "25,000+",
  sessionsDelivered: process.env.NEXT_PUBLIC_SESSIONS_DELIVERED?.trim() || "10,000+",
  globalReach: process.env.NEXT_PUBLIC_GLOBAL_REACH?.trim() || "25+",
  devotionalPlatformLine: "India's leading devotional platform",
  bhaktiSagarTvSubscribers: process.env.NEXT_PUBLIC_BHAKTISAGAR_TV_SUBSCRIBERS?.trim() || "100,000+",
  bhaktiSagarTvUrl: process.env.NEXT_PUBLIC_BHAKTISAGAR_TV_URL?.trim() || "https://www.youtube.com/@bhaktisagartv"
};

export const HOMEPAGE_DEITY_HOOKS: Record<BhaktiGuideId, string> = {
  krishna: "For life decisions and inner peace",
  shiv: "For stillness and emotional reset",
  hanuman: "For courage and focused action",
  lakshmi: "For money stress and steady growth",
  shani: "For tough phases and setbacks"
};

export const HOMEPAGE_QUICK_STARTERS: HomeQuickStarter[] = [
  {
    label: "I feel anxious",
    guideId: "krishna",
    prompt: "I feel anxious. Help me settle and act clearly."
  },
  {
    label: "I am confused about a decision",
    guideId: "krishna",
    prompt: "I am confused about a decision. Help me choose with dharma."
  },
  {
    label: "I want discipline",
    guideId: "shani",
    prompt: "I want discipline. Give me one steady plan I can follow today."
  },
  {
    label: "I am worried about money",
    guideId: "lakshmi",
    prompt: "I am worried about money. Give me a grounded next step."
  },
  {
    label: "I feel stuck",
    guideId: "shani",
    prompt: "I feel stuck and low on momentum. Help me move one step."
  }
];

export const HOMEPAGE_POPULAR_PROMPTS: HomePopularPrompt[] = [
  {
    title: "Calm my restless mind",
    prompt: "My mind is restless and overthinking. Help me find steadiness.",
    guideId: "krishna"
  },
  {
    title: "Duty vs fear",
    prompt: "I know my duty but fear is stopping me. How do I act now?",
    guideId: "krishna"
  },
  {
    title: "Discipline reset",
    prompt: "I keep delaying what matters. Give me one discipline reset for this week.",
    guideId: "shani"
  },
  {
    title: "Face delays without anger",
    prompt: "How do I stay calm when life delays my plans?",
    guideId: "shani"
  },
  {
    title: "Scarcity to steadiness",
    prompt: "I am trapped in scarcity thinking. Help me shift into steadiness.",
    guideId: "lakshmi"
  },
  {
    title: "Prosperity with dignity",
    prompt: "Guide me to build prosperity habits with gratitude and self-respect.",
    guideId: "lakshmi"
  }
];
