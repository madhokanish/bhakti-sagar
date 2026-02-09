import { getLocalDateISO, getWeekdayForDate, toUTCDateFromLocal } from "@/lib/choghadiya";

export type WeeklyDay =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type PujaTabKey = "about" | "benefits" | "process" | "temple";

export type OnlinePuja = {
  slug: string;
  title: string;
  tagline: string;
  deity: string;
  heroImageUrl: string;
  heroImageAlt: string;
  weeklyDay: WeeklyDay;
  startTime: string;
  timezone: string;
  isActive: boolean;
  temple: {
    name: string;
    city: string;
    state: string;
  };
  sections: {
    about: string[];
    benefits: string[];
    process: string[];
    temple: string[];
  };
  seo: {
    title: string;
    description: string;
  };
};

const weekdayIndex: Record<WeeklyDay, number> = {
  Sunday: 0,
  Monday: 1,
  Tuesday: 2,
  Wednesday: 3,
  Thursday: 4,
  Friday: 5,
  Saturday: 6
};

function shiftISODate(dateISO: string, days: number) {
  const date = new Date(`${dateISO}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function getNextPujaOccurrence({
  weeklyDay,
  startTime,
  timeZone,
  now = new Date()
}: {
  weeklyDay: WeeklyDay;
  startTime: string;
  timeZone: string;
  now?: Date;
}) {
  const todayISO = getLocalDateISO(timeZone);
  const todayWeekday = getWeekdayForDate(now, timeZone);
  const targetWeekday = weekdayIndex[weeklyDay];
  const dayDelta = (targetWeekday - todayWeekday + 7) % 7;

  let targetDateISO = shiftISODate(todayISO, dayDelta);
  let targetDate = toUTCDateFromLocal({
    dateISO: targetDateISO,
    time: startTime,
    timeZone
  });

  if (targetDate.getTime() <= now.getTime()) {
    targetDateISO = shiftISODate(targetDateISO, 7);
    targetDate = toUTCDateFromLocal({
      dateISO: targetDateISO,
      time: startTime,
      timeZone
    });
  }

  return targetDate;
}

export const onlinePujas: OnlinePuja[] = [
  {
    slug: "ganesh-vighnaharta",
    title: "Ganesh Vighnaharta Puja and Havan",
    tagline: "A weekly seva to remove obstacles and invite steady progress.",
    deity: "Ganesh",
    heroImageUrl: "/category/ganesha.jpg",
    heroImageAlt: "Ganesh deity image for online puja",
    weeklyDay: "Wednesday",
    startTime: "19:00",
    timezone: "Asia/Kolkata",
    isActive: true,
    temple: {
      name: "Shri Chintaman Ganesh Temple",
      city: "Ujjain",
      state: "Madhya Pradesh"
    },
    sections: {
      about: [
        "This weekly Ganesh puja focuses on invoking Vighnaharta, the remover of obstacles, before major life and work decisions.",
        "The sankalp is offered in your name, and the puja sequence includes mantra japa, deepam, and havan for a complete offering."
      ],
      benefits: [
        "Prayed for smoother progress in personal and professional goals.",
        "Traditionally observed for clarity before new beginnings.",
        "A devotional routine for grounding the family each week."
      ],
      process: [
        "Submit your name and details in the interest form.",
        "Our team confirms the next Wednesday slot and participation details.",
        "The puja is performed at the temple with sankalp in your name."
      ],
      temple: [
        "Shri Chintaman Ganesh Temple in Ujjain is among the most visited Ganesh shrines in central India.",
        "The temple is known for seva dedicated to peace of mind, obstacle removal, and auspicious starts."
      ]
    },
    seo: {
      title: "Online Ganesh Vighnaharta Puja and Havan",
      description:
        "Join weekly Ganesh Vighnaharta Puja and Havan from Shri Chintaman Ganesh Temple, Ujjain. Register interest and receive participation details."
    }
  },
  {
    slug: "hanuman-family-peace",
    title: "Hanuman Puja for Family Peace and Prosperity",
    tagline: "Weekly Tuesday puja for harmony, courage, and household wellbeing.",
    deity: "Hanuman",
    heroImageUrl: "/category/hanuman.jpg",
    heroImageAlt: "Hanuman deity image for online puja",
    weeklyDay: "Tuesday",
    startTime: "20:00",
    timezone: "Asia/Kolkata",
    isActive: true,
    temple: {
      name: "Prachin Hanuman Temple",
      city: "Ujjain",
      state: "Madhya Pradesh"
    },
    sections: {
      about: [
        "This weekly Hanuman puja is designed for families seeking steadiness, peace, and spiritual protection.",
        "The seva includes Hanuman Chalisa path, sankalp, and temple offerings made in your name."
      ],
      benefits: [
        "Traditionally observed for family harmony and resilience.",
        "A devotional practice for courage during stressful periods.",
        "Supports a weekly rhythm of gratitude and prayer."
      ],
      process: [
        "Fill the interest form with your details and intention.",
        "Receive confirmation for the next Tuesday puja cycle.",
        "Temple priests perform the seva and include your sankalp."
      ],
      temple: [
        "The seva is hosted at a traditional Hanuman temple in Ujjain known for Tuesday worship.",
        "The temple ritual sequence includes aarti, mantra recitation, and prasadam offerings."
      ]
    },
    seo: {
      title: "Online Hanuman Puja for Family Peace and Prosperity",
      description:
        "Register for weekly Hanuman Puja focused on family peace and prosperity. Tuesday seva with sankalp and temple ritual updates."
    }
  },
  {
    slug: "coming-soon",
    title: "Mahalakshmi Prosperity Puja",
    tagline: "New online seva will be announced soon.",
    deity: "Lakshmi",
    heroImageUrl: "/category/lakshmi.jpg",
    heroImageAlt: "Lakshmi deity image for upcoming online puja",
    weeklyDay: "Friday",
    startTime: "19:30",
    timezone: "Asia/Kolkata",
    isActive: false,
    temple: {
      name: "Details coming soon",
      city: "TBD",
      state: "TBD"
    },
    sections: {
      about: [],
      benefits: [],
      process: [],
      temple: []
    },
    seo: {
      title: "Online Lakshmi Puja (Coming Soon)",
      description:
        "A new online Lakshmi puja option is being prepared. Check back for schedule and temple details."
    }
  }
];

export function getOnlinePujaBySlug(slug: string) {
  return onlinePujas.find((puja) => puja.slug === slug);
}

export function getActiveOnlinePujas() {
  return onlinePujas.filter((puja) => puja.isActive);
}
