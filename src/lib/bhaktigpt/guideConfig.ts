import type { BhaktiGuideId } from "@/lib/bhaktigpt/guides";

export type GuideUiConfig = {
  id: BhaktiGuideId;
  displayName: string;
  subtitle?: string;
  avatarPath: string;
  avatarObjectPosition?: string;
};

export const GUIDE_CONFIG: Record<BhaktiGuideId, GuideUiConfig> = {
  krishna: {
    id: "krishna",
    displayName: "Shri Krishna",
    subtitle: "Clarity in tough decisions",
    avatarPath: "/guides/krishna-avatar.jpg",
    avatarObjectPosition: "50% 20%"
  },
  lakshmi: {
    id: "lakshmi",
    displayName: "Goddess Lakshmi",
    subtitle: "Prosperity with steadiness",
    avatarPath: "/guides/lakshmi-avatar.jpg",
    avatarObjectPosition: "50% 22%"
  },
  shani: {
    id: "shani",
    displayName: "Shani Dev",
    subtitle: "Discipline through setbacks",
    avatarPath: "/guides/shani-avatar.jpg",
    avatarObjectPosition: "50% 18%"
  }
};

export function getGuideConfig(guideId: BhaktiGuideId) {
  return GUIDE_CONFIG[guideId];
}

