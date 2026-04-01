import Link from "next/link";
import { getRelatedKeywordTargets, type DeitySlug, type Locale } from "@/lib/hindiSeoContent";

type RelatedHindiLinksProps = {
  deity: DeitySlug;
  locale: Locale;
  currentPath: string;
};

type LinkItem = {
  href: string;
  label: string;
};

function normalizePath(path: string) {
  return path.endsWith("/") && path.length > 1 ? path.slice(0, -1) : path;
}

function toLocalePath(path: string, locale: Locale) {
  const prefixed = path.startsWith("/") ? path : `/${path}`;
  const withoutLocale = prefixed.replace(/^\/(en|hi)(?=\/|$)/, "") || "/";
  const normalized = withoutLocale.startsWith("/") ? withoutLocale : `/${withoutLocale}`;
  const [basePath, queryString = ""] = normalized.split("?");
  const canonicalBasePath =
    basePath === "/bhaktigpt/chat"
      ? "/chat"
      : basePath;

  if (canonicalBasePath === "/chat") {
    const params = new URLSearchParams(queryString);
    if (locale === "hi") {
      params.set("lang", "hi");
    } else {
      params.delete("lang");
    }
    const query = params.toString();
    return query ? `/chat?${query}` : "/chat";
  }

  if (locale === "hi") {
    return canonicalBasePath === "/" ? "/hi" : `/hi${canonicalBasePath}`;
  }

  return canonicalBasePath;
}

function dedupeLinks(items: LinkItem[], currentPath: string) {
  const seen = new Set<string>();
  const normalizedCurrent = normalizePath(currentPath);
  const output: LinkItem[] = [];

  for (const item of items) {
    const normalizedHref = normalizePath(item.href);
    if (normalizedHref === normalizedCurrent) continue;
    if (seen.has(normalizedHref)) continue;
    seen.add(normalizedHref);
    output.push(item);
  }

  return output;
}

export default function RelatedHindiLinks({ deity, locale, currentPath }: RelatedHindiLinksProps) {
  const targets = getRelatedKeywordTargets(deity);
  const deityHub = targets.deity.find((item) => item.targetPath.endsWith(`/${deity}`));
  const coreHub = targets.core.find((item) => item.primaryKeyword === "भगवान से बात करें") || targets.core[0];
  const siblingCandidates = targets.deity.filter((item) => !item.targetPath.endsWith(`/${deity}`)).slice(0, 2);
  const nextBest = targets.general.slice(0, 2);

  const rawLinks: LinkItem[] = [
    {
      href: toLocalePath(deityHub?.targetPath ?? `/hi/${deity}`, locale),
      label: deityHub?.primaryKeyword ?? "देवता मार्गदर्शन"
    },
    {
      href: toLocalePath(coreHub?.targetPath ?? "/hi", locale),
      label: coreHub?.primaryKeyword ?? "भगवान से बात करें"
    },
    ...siblingCandidates.map((item) => ({
      href: toLocalePath(item.targetPath, locale),
      label: item.primaryKeyword
    })),
    ...nextBest.map((item) => ({
      href: toLocalePath(item.targetPath, locale),
      label: item.primaryKeyword
    }))
  ];

  const links = dedupeLinks(rawLinks, currentPath).slice(0, 6);

  return (
    <section className="mt-10 rounded-2xl border border-sagar-amber/20 bg-white/80 p-5">
      <h2 className="text-lg font-serif text-sagar-ink">{locale === "hi" ? "संबंधित लिंक" : "Related links"}</h2>
      <ul className="mt-3 grid gap-2 md:grid-cols-2">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm font-semibold text-sagar-ember hover:text-sagar-saffron">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
