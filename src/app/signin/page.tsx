import { redirect } from "next/navigation";

type SignInPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

function normalizeCallbackUrl(input: string | undefined) {
  if (!input) return "/profile";
  if (input.startsWith("/")) return input;

  try {
    const parsed = new URL(input);
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return "/profile";
  }
}

export default function SignInPage({ searchParams }: SignInPageProps) {
  const callbackUrl = normalizeCallbackUrl(searchParams?.callbackUrl);
  redirect(`/?auth=1&callbackUrl=${encodeURIComponent(callbackUrl)}`);
}
