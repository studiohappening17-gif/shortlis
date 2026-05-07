import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import type { SeoCategory } from "@/lib/types";
import {
  breadcrumbJsonLd,
  buildMeta,
  canonicalLink,
  collectionPageJsonLd,
  jsonLdScript,
} from "@/lib/seo";
import { ThemeToggle } from "@/components/ThemeToggle";

type DealsRow = Pick<
  SeoCategory,
  "id" | "slug" | "title" | "meta_description" | "hero_image_url"
>;

const PAGE_TITLE = "Seasonal Amazon Deals & Gift Guides";
const PAGE_DESC =
  "Browse curated Amazon deal pages — Black Friday, Prime Day, Mother's Day, Christmas decorations and every major shopping season, all updated daily.";

export const Route = createFileRoute("/deals")({
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  loader: async (): Promise<DealsRow[]> => {
    const { data } = await supabase
      .from("seo_categories")
      .select("id,slug,title,meta_description,hero_image_url")
      .eq("is_published", true)
      .order("sort_order");
    return (data as DealsRow[]) ?? [];
  },
  head: ({ loaderData }) => ({
    meta: buildMeta({ title: PAGE_TITLE, description: PAGE_DESC, path: "/deals" }),
    links: [canonicalLink("/deals")],
    scripts: [
      jsonLdScript(
        collectionPageJsonLd({
          name: PAGE_TITLE,
          description: PAGE_DESC,
          path: "/deals",
          itemNames: (loaderData ?? []).map((c) => c.title),
        }),
      ),
      jsonLdScript(
        breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Deals", path: "/deals" },
        ]),
      ),
    ],
  }),
  component: DealsHub,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
});

function DealsHub() {
  const cats = Route.useLoaderData();
  return (
    <div className="min-h-screen bg-background">
      <div className="absolute top-4 right-4 z-10"><ThemeToggle /></div>
      <main className="mx-auto max-w-4xl px-4 py-12 sm:py-16">
        <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground mb-4">
          <Link to="/" className="hover:underline">Home</Link>
          <span className="mx-2">/</span>
          <span>Deals</span>
        </nav>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
          {PAGE_TITLE}
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl">{PAGE_DESC}</p>

        <h2 className="mt-10 mb-4 text-lg font-semibold">Shop by Season &amp; Category</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {cats.map((c) => (
            <li key={c.id}>
              <Link
                to="/deals/$slug"
                params={{ slug: c.slug }}
                className="block rounded-[14px] border border-border/70 bg-card p-4 hover:border-amazon transition-colors"
              >
                <h3 className="font-semibold text-foreground">{c.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                  {c.meta_description}
                </p>
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-10 text-center text-xs text-muted-foreground/80">
          As an Amazon Associate, we earn from qualifying purchases.
        </p>
      </main>
    </div>
  );
}
