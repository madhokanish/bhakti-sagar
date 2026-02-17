export const DEITY_NAMES = {
  ganesh: {
    heading: "Lord Ganesh",
    body: "Ganesh Ji"
  },
  shani: {
    heading: "Shani Dev",
    body: "Shani Dev"
  }
} as const;

export function getDeityName(
  deity: keyof typeof DEITY_NAMES,
  tone: "heading" | "body" = "heading"
) {
  return DEITY_NAMES[deity][tone];
}
