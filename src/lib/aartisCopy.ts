import type { HomeLang } from "@/lib/homeCopy";

export const AARTIS_COPY: Record<HomeLang, {
  page_title: string;
  section_kicker: string;
  h1: string;
  count_suffix: string;
  search_label: string;
  search_placeholder: string;
}> = {
  en: {
    page_title: "All Aartis & Bhajans | BhaktiChat",
    section_kicker: "Aarti Library",
    h1: "All Aartis & Bhajans",
    count_suffix: "prayers available",
    search_label: "Search",
    search_placeholder: "Search aarti or bhajan..."
  },
  hinglish: {
    page_title: "All Aartis & Bhajans | BhaktiChat",
    section_kicker: "Aarti Library",
    h1: "Saari Aartis aur Bhajans",
    count_suffix: "aartiyan available",
    search_label: "Search",
    search_placeholder: "Aarti ya bhajan search karo..."
  },
  hi: {
    page_title: "सभी आरती और भजन | भक्ति चैट",
    section_kicker: "आरती संग्रह",
    h1: "सभी आरती और भजन",
    count_suffix: "प्रार्थनाएँ उपलब्ध",
    search_label: "खोजें",
    search_placeholder: "आरती या भजन खोजें..."
  }
};
