import type { OnlinePuja } from "@/lib/onlinePuja";

export type PujaCardOption = {
  id: string;
  label: string;
  subtitle?: string;
  priceGBP: number;
  badge?: string;
  enabled?: boolean;
};

export type PujaBenefitItem = {
  id: string;
  icon: string;
  title: string;
  description: string;
};

export type PujaReview = {
  id: string;
  name: string;
  location: string;
  rating: number;
  text: string;
};

export type PujaFaq = {
  question: string;
  answer: string;
};

export type PujaDetailConfig = {
  subtitle: string;
  carouselImages: Array<{ src: string; alt: string }>;
  topChips: Array<{ icon: string; label: string }>;
  bookingOptions: PujaCardOption[];
  deliverablesTimeline: Array<{ stage: string; text: string }>;
  benefitCards: PujaBenefitItem[];
  howItWorks: string[];
  templeImages: Array<{ src: string; alt: string }>;
  templeCredibility: string;
  reviews: PujaReview[];
  faqs: PujaFaq[];
};

const sharedFaqs: PujaFaq[] = [
  {
    question: "Can I join from outside India?",
    answer:
      "Yes. The seva is arranged at the temple in India while you participate remotely. Schedule is shown in your local timezone and in IST."
  },
  {
    question: "Will sankalp include my name?",
    answer:
      "Yes. During booking you can add your name, family names, gotra, and intention so the sankalp is performed in your name."
  },
  {
    question: "How soon do I receive updates after the puja?",
    answer:
      "You receive confirmation instantly and post-puja updates, including video link and certificate, within about 24 hours."
  }
];

const detailConfigBySlug: Record<string, Omit<PujaDetailConfig, "faqs"> & { faqs?: PujaFaq[] }> = {
  "ganesh-vighnaharta": {
    subtitle: "A powerful weekly puja to remove obstacles and invite steady progress.",
    carouselImages: [
      { src: "/category/ganesha.jpg", alt: "Lord Ganesh temple darshan for online puja" },
      { src: "/category/lakshmi.jpg", alt: "Temple puja altar setup" },
      { src: "/category/hanuman.jpg", alt: "Devotees attending evening aarti" }
    ],
    topChips: [
      { icon: "🕉️", label: "Obstacles removed" },
      { icon: "📈", label: "Success in new ventures" },
      { icon: "🪔", label: "Peace of mind" }
    ],
    bookingOptions: [
      {
        id: "basic",
        label: "Basic Seva",
        priceGBP: 2.99,
        badge: "Limited offer",
        enabled: true
      },
      {
        id: "extended-sankalp",
        label: "Seva + Extended Sankalp",
        subtitle: "Extended sankalp and name list",
        priceGBP: 4.99,
        enabled: true
      },
      {
        id: "prasad-delivery",
        label: "Seva + Prasad delivery",
        subtitle: "Worldwide prasad delivery",
        priceGBP: 9.99,
        badge: "Our best offer",
        enabled: false
      }
    ],
    deliverablesTimeline: [
      { stage: "Instant", text: "Booking confirmation email" },
      { stage: "Before puja", text: "Sankalp is confirmed with your name shown" },
      { stage: "After puja (within 24 hrs)", text: "Video update link" },
      { stage: "After puja (within 24 hrs)", text: "Personalised certificate PDF with your name" }
    ],
    benefitCards: [
      {
        id: "obstacles",
        icon: "🕉️",
        title: "Remove obstacles",
        description: "Weekly Ganesh Ji sankalp for smoother progress in work, family, and important decisions."
      },
      {
        id: "success",
        icon: "📿",
        title: "Success and prosperity",
        description: "Traditionally chosen before new starts to invite clarity, confidence, and momentum."
      },
      {
        id: "peace",
        icon: "🪔",
        title: "Inner peace",
        description: "A calm devotional rhythm that helps reduce anxiety and keeps intentions centered."
      }
    ],
    howItWorks: [
      "Choose your seva option and add your sankalp details.",
      "Receive immediate booking confirmation with local time and IST.",
      "Temple priests perform the puja and share post-puja updates within 24 hours."
    ],
    templeImages: [
      { src: "/category/ganesha.jpg", alt: "Shri Chintaman Ganesh Temple sanctum" },
      { src: "/category/shiva.jpg", alt: "Temple priest preparing havan" },
      { src: "/category/lakshmi.jpg", alt: "Devotees offering lamps in temple" }
    ],
    templeCredibility:
      "Shri Chintaman Ganesh Temple, Ujjain, follows a fixed weekly seva schedule and sankalp ritual led by temple priests.",
    reviews: [
      {
        id: "r1",
        name: "Megha S.",
        location: "London, UK",
        rating: 5,
        text: "Booking was simple, and the timing shown in UK local time removed confusion. Sankalp details were correctly captured."
      },
      {
        id: "r2",
        name: "Raghav K.",
        location: "Leicester, UK",
        rating: 5,
        text: "The confirmation email came instantly and the follow-up update felt personal and respectful."
      },
      {
        id: "r3",
        name: "Nisha P.",
        location: "New Jersey, USA",
        rating: 4,
        text: "Very clear process for NRIs. I liked seeing both local time and IST before payment."
      },
      {
        id: "r4",
        name: "Arun D.",
        location: "Dubai, UAE",
        rating: 5,
        text: "Support replied quickly and helped with gotra and family names. The process was smooth."
      },
      {
        id: "r5",
        name: "Priya M.",
        location: "Mumbai, India",
        rating: 5,
        text: "Simple and trustworthy flow. I booked in under two minutes."
      },
      {
        id: "r6",
        name: "Karan V.",
        location: "Toronto, Canada",
        rating: 4,
        text: "Useful reminders and clear what I would receive after the puja."
      }
    ]
  },
  "hanuman-family-peace": {
    subtitle: "A weekly Hanuman seva for family peace, strength, and prosperity.",
    carouselImages: [
      { src: "/category/hanuman.jpg", alt: "Hanuman temple for family peace puja" },
      { src: "/category/shakti.jpg", alt: "Temple ritual arrangement" },
      { src: "/category/vishnu.jpg", alt: "Puja offerings and deepam" }
    ],
    topChips: [
      { icon: "🛡️", label: "Family protection" },
      { icon: "❤️", label: "Peace at home" },
      { icon: "🌿", label: "Steady prosperity" }
    ],
    bookingOptions: [
      {
        id: "basic",
        label: "Basic Seva",
        priceGBP: 2.99,
        badge: "Limited offer",
        enabled: true
      },
      {
        id: "extended-sankalp",
        label: "Seva + Extended Sankalp",
        subtitle: "Extra name inclusion",
        priceGBP: 4.99,
        enabled: true
      },
      {
        id: "prasad-delivery",
        label: "Seva + Prasad delivery",
        subtitle: "Worldwide prasad delivery",
        priceGBP: 9.99,
        badge: "Our best offer",
        enabled: false
      }
    ],
    deliverablesTimeline: [
      { stage: "Instant", text: "Booking confirmation email" },
      { stage: "Before puja", text: "Sankalp is confirmed with your name shown" },
      { stage: "After puja (within 24 hrs)", text: "Video update link" },
      { stage: "After puja (within 24 hrs)", text: "Personalised certificate PDF with your name" }
    ],
    benefitCards: [
      {
        id: "courage",
        icon: "🔥",
        title: "Courage in challenges",
        description: "Hanuman upasana supports resilience when family or work life feels uncertain."
      },
      {
        id: "harmony",
        icon: "🏠",
        title: "Family harmony",
        description: "A weekly sankalp for peace and communication in the home environment."
      },
      {
        id: "focus",
        icon: "📘",
        title: "Mental clarity",
        description: "Helps create a devotional reset each week with focused intentions."
      }
    ],
    howItWorks: [
      "Select seva option and add the people you want included in sankalp.",
      "Review schedule in your local timezone or IST and complete payment.",
      "Receive confirmation, post-puja update, and certificate within 24 hours after completion."
    ],
    templeImages: [
      { src: "/category/hanuman.jpg", alt: "Hanuman temple murti during puja" },
      { src: "/category/ganesha.jpg", alt: "Temple puja sequence" },
      { src: "/category/shiva.jpg", alt: "Priest preparing sankalp" }
    ],
    templeCredibility:
      "The Tuesday seva is coordinated with temple priests in Ujjain and follows a standard ritual sequence with sankalp inclusion.",
    reviews: [
      {
        id: "h1",
        name: "Ritu A.",
        location: "Birmingham, UK",
        rating: 5,
        text: "I booked for family peace and got clear communication throughout. Easy for UK timezone users."
      },
      {
        id: "h2",
        name: "Vivek T.",
        location: "Delhi, India",
        rating: 4,
        text: "Straightforward booking and clear deliverables. Sankalp details were handled properly."
      },
      {
        id: "h3",
        name: "Neha R.",
        location: "San Francisco, USA",
        rating: 5,
        text: "Loved the calm UI and confidence from seeing temple verification and support links."
      },
      {
        id: "h4",
        name: "Amit J.",
        location: "Abu Dhabi, UAE",
        rating: 4,
        text: "Quick booking flow and useful reminder for upcoming seva."
      },
      {
        id: "h5",
        name: "Shweta L.",
        location: "Pune, India",
        rating: 5,
        text: "Helpful for weekly devotion without complexity."
      },
      {
        id: "h6",
        name: "Mohan B.",
        location: "Vancouver, Canada",
        rating: 5,
        text: "Easy process and a respectful format for adding family names and gotra."
      }
    ]
  }
};

export function getPujaDetailConfig(puja: OnlinePuja): PujaDetailConfig {
  const source = detailConfigBySlug[puja.slug];

  if (!source) {
    return {
      subtitle: puja.tagline,
      carouselImages: [{ src: puja.heroImageUrl, alt: puja.heroImageAlt }],
      topChips: [
        { icon: "🪔", label: "Temple-led seva" },
        { icon: "🙏", label: "Sankalp in your name" },
        { icon: "📧", label: "Email confirmation" }
      ],
      bookingOptions: [
        { id: "basic", label: "Basic Seva", priceGBP: 2.99, badge: "Limited offer", enabled: true }
      ],
      deliverablesTimeline: [
        { stage: "Instant", text: "Booking confirmation email" },
        { stage: "Before puja", text: "Sankalp is confirmed with your name shown" },
        { stage: "After puja (within 24 hrs)", text: "Video update link" },
        { stage: "After puja (within 24 hrs)", text: "Personalised certificate PDF with your name" }
      ],
      benefitCards: puja.sections.benefits.slice(0, 3).map((item, index) => ({
        id: `benefit-${index + 1}`,
        icon: "✨",
        title: `Benefit ${index + 1}`,
        description: item
      })),
      howItWorks: puja.sections.process.slice(0, 3),
      templeImages: [{ src: puja.heroImageUrl, alt: puja.heroImageAlt }],
      templeCredibility: `${puja.temple.name}, ${puja.temple.city}`,
      reviews: [],
      faqs: sharedFaqs
    };
  }

  return {
    ...source,
    faqs: source.faqs ?? sharedFaqs
  };
}
