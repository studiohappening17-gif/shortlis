/**
 * SEO helpers — meta tags + JSON-LD for TanStack Router head().
 */

export const SITE_NAME = "Amazon Discount Finder";
export const SITE_URL =
  (typeof process !== "undefined" && process.env?.SITE_URL) ||
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SITE_URL) ||
  "https://project--b6f3aade-28f2-4267-a14a-f581e0882e3e.lovable.app";

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

export type MetaTag = Record<string, string>;

type BuildMetaInput = {
  title: string;
  description: string;
  path: string; // absolute path, e.g. "/deals/black-friday-deals"
  image?: string | null;
  type?: "website" | "article";
  keywords?: string[];
};

export function buildMeta({
  title,
  description,
  path,
  image,
  type = "website",
  keywords,
}: BuildMetaInput): MetaTag[] {
  const url = absoluteUrl(path);
  const img = image || DEFAULT_OG_IMAGE;
  const meta: MetaTag[] = [
    { title },
    { name: "description", content: description },
    ...(keywords?.length ? [{ name: "keywords", content: keywords.join(", ") }] : []),
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:url", content: url },
    { property: "og:type", content: type },
    { property: "og:image", content: img },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: img },
  ];
  return meta;
}

export function canonicalLink(path: string) {
  return { rel: "canonical", href: absoluteUrl(path) };
}

export function absoluteUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL.replace(/\/+$/, "")}${p}`;
}

/** Build a JSON-LD <script> entry compatible with TanStack head().scripts */
export function jsonLdScript(data: unknown) {
  return {
    type: "application/ld+json",
    children: JSON.stringify(data),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: DEFAULT_OG_IMAGE,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/deals?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: absoluteUrl(it.path),
    })),
  };
}

export function collectionPageJsonLd(opts: {
  name: string;
  description: string;
  path: string;
  itemNames: string[];
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: absoluteUrl(opts.path),
    mainEntity: {
      "@type": "ItemList",
      itemListElement: opts.itemNames.map((name, i) => ({
        "@type": "ListItem",
        position: i + 1,
        name,
      })),
    },
  };
}
