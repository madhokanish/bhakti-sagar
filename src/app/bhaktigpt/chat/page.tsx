import { permanentRedirect } from "next/navigation";

type LegacyChatPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function LegacyBhaktiGptChatPage({ searchParams }: LegacyChatPageProps) {
  const query = new URLSearchParams();
  if (searchParams) {
    for (const [key, rawValue] of Object.entries(searchParams)) {
      if (rawValue === undefined) continue;
      if (Array.isArray(rawValue)) {
        for (const value of rawValue) {
          query.append(key, value);
        }
      } else {
        query.set(key, rawValue);
      }
    }
  }

  permanentRedirect(query.toString() ? `/chat?${query.toString()}` : "/chat");
}
