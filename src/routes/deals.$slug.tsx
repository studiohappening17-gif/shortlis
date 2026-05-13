import { createFileRoute, ErrorComponent, Link, notFound } from "@tanstack/react-router";
import { Search } from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { supabase } from "@/integrations/supabase/client";

const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ["p", "h2", "h3", "h4", "a", "ul", "ol", "li", "strong", "em", "br", "span", "blockquote"],
  ALLOWED_ATTR: ["href", "target", "rel"],
};
const sanitize = (html: string) => DOMPurify.sanitize(html ?? "", SANITIZE_CONFIG);
import type { SeoCategory } from "@/lib/types";
import {
  breadcrumbJsonLd,
  buildMeta,
  canonicalLink,
  jsonLdScript,
  absoluteUrl,
  SITE_NAME,
} from "@/lib/seo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/deals/$slug")({
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  loader: async ({ params }): Promise<SeoCategory> => {
    const { data } = await supabase
      .from("seo_categories")
      .select("*")
      .eq("slug", params.slug)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) throw notFound();
    return data as SeoCategory;
  },
  head: ({ loaderData, params }) => {
    if (!loaderData) {
      return { meta: [{ title: "Deal not found" }] };
    }
    const path = `/deals/${params.slug}`;
    const image = loaderData.og_image_url || loaderData.hero_image_url || undefined;
    return {
      meta: buildMeta({
        title: loaderData.meta_title,
        description: loaderData.meta_description,
        path,
        image,
        type: "article",
        keywords: loaderData.keywords,
      }),
      links: [canonicalLink(path)],
      scripts: [
        jsonLdScript(
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Deals", path: "/deals" },
            { name: loaderData.title, path },
          ]),
        ),
        jsonLdScript({
          "@context": "https://schema.org",
          "@type": "Article",
          headline: loaderData.meta_title,
          description: loaderData.meta_description,
          image: image ? [image] : undefined,
          mainEntityOfPage: absoluteUrl(path),
          author: { "@type": "Organization", name: SITE_NAME },
          publisher: {
            "@type": "Organization",
            name: SITE_NAME,
            logo: { "@type": "ImageObject", url: absoluteUrl("/og-default.png") },
          },
        }),
      ],
    };
  },
  component: DealLanding,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
  notFoundComponent: () => (
    <div className="p-8 text-center">
      <h1 className="text-2xl font-bold">Deal not found</h1>
      <Link to="/deals" className="mt-4 inline-block text-primary hover:underline">
        Browse all deals
      </Link>
    </div>
  ),
});

function DealLanding() {
  const c = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <main className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <Link to="/deals" className="hover:underline">Deals</Link>
          <span className="mx-2">/</span>
          <span>{c.title}</span>
        </nav>

        {c.hero_image_url && (
          <img
            src={c.hero_image_url}
            alt={`${c.title} — top Amazon deals`}
            className="w-full aspect-[16/9] object-cover rounded-[20px] mb-6"
            fetchPriority="high"
            decoding="async"
          />
        )}

        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {c.h1}
        </h1>

        <div
          className="prose prose-neutral dark:prose-invert mt-5 max-w-none"
          dangerouslySetInnerHTML={{ __html: sanitize(c.intro_html) }}
        />

        <div className="mt-6">
          <a href={c.affiliate_url} target="_blank" rel="noopener noreferrer sponsored">
            <Button className="h-12 px-6 rounded-[14px] bg-amazon hover:bg-amazon-hover text-amazon-foreground">
              <Search className="h-4 w-4 mr-2" /> Shop {c.title} on Amazon
            </Button>
          </a>
        </div>

        {c.body_html && (
          <div
            className="prose prose-neutral dark:prose-invert mt-8 max-w-none"
            dangerouslySetInnerHTML={{ __html: sanitize(c.body_html) }}
          />
        )}

        {c.keywords?.length > 0 && (
          <section className="mt-10">
            <h2 className="text-lg font-semibold">Related searches</h2>
            <ul className="mt-3 flex flex-wrap gap-2">
              {c.keywords.map((kw: string) => (
                <li
                  key={kw}
                  className="rounded-full border border-border/70 bg-muted px-3 py-1 text-xs text-muted-foreground"
                >
                  {kw}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-10">
          <h2 className="text-lg font-semibold">Explore more deals</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Looking for something else?{" "}
            <Link to="/deals" className="text-primary hover:underline">
              Browse all seasonal Amazon deals
            </Link>
            {" "}or{" "}
            <Link to="/" className="text-primary hover:underline">
              use the deal finder
            </Link>
            .
          </p>
        </section>

        <p className="mt-10 text-center text-xs text-muted-foreground/80">
          As an Amazon Associate, we earn from qualifying purchases.
        </p>
      </main>
    </div>
  );
}
