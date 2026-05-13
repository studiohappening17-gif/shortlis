/**
 * <Seo /> — reusable SEO component.
 *
 * Renders SSR-safe <title>, <meta>, <link rel="canonical"> and Open Graph /
 * Twitter tags using React 19's native head-tag hoisting. Drop into any route
 * component; omitted props fall back to {@link DEFAULT_SEO}.
 *
 * @example
 *   <Seo
 *     title="Black Friday Deals | ShortListed"
 *     description="Top Black Friday picks under $30."
 *     path="/deals/black-friday"
 *   />
 */
import { DEFAULT_SEO, SITE_NAME, SITE_URL, DEFAULT_OG_IMAGE, absoluteUrl } from "@/lib/seo";

export type SeoProps = {
  title?: string;
  description?: string;
  keywords?: string[];
  path?: string;
  image?: string | null;
  type?: "website" | "article";
  noindex?: boolean;
};

export function Seo({
  title = DEFAULT_SEO.title,
  description = DEFAULT_SEO.description,
  keywords = [...DEFAULT_SEO.keywords],
  path,
  image,
  type = "website",
  noindex = false,
}: SeoProps) {
  const url = path ? absoluteUrl(path) : SITE_URL;
  const img = image || DEFAULT_OG_IMAGE;
  const kw = keywords.filter(Boolean).join(", ");

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {kw && <meta name="keywords" content={kw} />}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={img} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={img} />
    </>
  );
}

export default Seo;
