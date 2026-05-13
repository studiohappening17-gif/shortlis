import { createFileRoute, ErrorComponent, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Loader2, Search, Settings } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chipClasses, gridColsForCount } from "@/lib/chip-styles";
import { resolveAffiliateUrl } from "@/lib/resolve-affiliate-url";
import type { Department, Keyword, SeoCategory, Tier } from "@/lib/types";
import {
  buildMeta,
  canonicalLink,
  jsonLdScript,
  websiteJsonLd,
} from "@/lib/seo";
import { Seo } from "@/components/Seo";

type SeoLink = Pick<SeoCategory, "id" | "slug" | "title">;

type HomeData = {
  departments: Department[];
  discountTiers: Tier[];
  priceTiers: Tier[];
  reviewTiers: Tier[];
  keywords: Pick<Keyword, "id" | "label" | "affiliate_url" | "emoji">[];
  seoCategories: SeoLink[];
};

const loadHomeData = async (): Promise<HomeData> => {
  const [d, dt, pt, rt, kw, sc] = await Promise.all([
    supabase.from("departments").select("id,name,sort_order,default_affiliate_url").order("sort_order").order("name"),
    supabase.from("discount_tiers").select("id,label,value,sort_order").order("sort_order"),
    supabase.from("price_tiers").select("id,label,value,sort_order").order("sort_order"),
    supabase.from("review_tiers").select("id,label,value,sort_order").order("sort_order"),
    supabase.from("keywords").select("id,label,affiliate_url,emoji").order("sort_order"),
    supabase.from("seo_categories").select("id,slug,title").eq("is_published", true).order("sort_order"),
  ]);
  return {
    departments: (d.data as Department[]) ?? [],
    discountTiers: (dt.data as Tier[]) ?? [],
    priceTiers: (pt.data as Tier[]) ?? [],
    reviewTiers: (rt.data as Tier[]) ?? [],
    keywords: kw.data ?? [],
    seoCategories: (sc.data as SeoLink[]) ?? [],
  };
};

const HOME_TITLE = "Amazon Discount Finder — Find 80%+ Off Hidden Deals";
const HOME_DESC =
  "Find the best Amazon deals and discounts. Filter by department, discount, price and reviews — plus curated pages for Black Friday, Prime Day, Christmas, Mother's Day, Father's Day and more.";

export const Route = createFileRoute("/")({
  loader: () => loadHomeData(),
  staleTime: 5 * 60 * 1000,
  gcTime: 30 * 60 * 1000,
  head: () => ({
    meta: buildMeta({ title: HOME_TITLE, description: HOME_DESC, path: "/" }),
    links: [canonicalLink("/")],
    scripts: [jsonLdScript(websiteJsonLd())],
  }),
  component: HomePage,
  errorComponent: ({ error }) => <ErrorComponent error={error} />,
  notFoundComponent: () => <div className="p-8 text-center">Not found</div>,
});

function HomePage() {
  const data = Route.useLoaderData();
  const initial = useMemo(
    () => ({
      discount: data.discountTiers[0]?.value ?? "any",
      price: data.priceTiers[0]?.value ?? "any",
      review: data.reviewTiers[0]?.value ?? "any",
    }),
    [data],
  );
  const [dept, setDept] = useState("any");
  const [discount, setDiscount] = useState(initial.discount);
  const [price, setPrice] = useState(initial.price);
  const [review, setReview] = useState(initial.review);
  const [searching, setSearching] = useState(false);
  const loading = false;

  const handleSearch = async () => {
    setSearching(true);
    try {
      const target = await resolveAffiliateUrl({ deptId: dept, discount, price, review });
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error("Search failed");
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  const { departments, discountTiers, priceTiers, reviewTiers, keywords, seoCategories } = data;

  return (
    <div className="min-h-screen bg-background relative">
      <Seo
        title={HOME_TITLE}
        description={HOME_DESC}
        keywords={["Best Gift Idea under 30", "Affordable Amazon Finds 2026", "Amazon Affiliate Recommendations"]}
        path="/"
      />
      <TopBar />

      <main className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <PageHeader />

        {keywords.length > 0 && <KeywordChips items={keywords} />}

        <div className="rounded-[20px] border border-border/70 bg-card shadow-[0_8px_30px_rgb(17,24,39,0.06)] p-6 sm:p-8 space-y-6">
          <DepartmentChips
            departments={departments}
            value={dept}
            onChange={setDept}
            disabled={loading}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            <ChipGroup label="Discount" tiers={discountTiers} value={discount} onChange={setDiscount} />
            <ChipGroup label="Reviews" tiers={reviewTiers} value={review} onChange={setReview} />
          </div>

          <ChipGroup label="Price" tiers={priceTiers} value={price} onChange={setPrice} />

          <Button
            onClick={handleSearch}
            disabled={searching || loading}
            className="w-full h-14 text-base font-medium rounded-[14px] bg-amazon hover:bg-amazon-hover active:brightness-95 text-amazon-foreground shadow-sm transition-colors"
          >
            {searching ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                <Search className="h-4 w-4 mr-2" /> Search
              </>
            )}
          </Button>
        </div>

        {seoCategories.length > 0 && (
          <section aria-labelledby="guides-heading" className="mt-12">
            <div className="flex items-baseline justify-between gap-4">
              <h2 id="guides-heading" className="text-lg font-semibold text-foreground">
                Latest Shopping Guides
              </h2>
              <Link to="/deals" className="text-xs text-primary hover:underline whitespace-nowrap">
                View all →
              </Link>
            </div>
          </section>
        )}

        <footer className="mt-10 text-center text-xs text-muted-foreground/80">
          As an Amazon Associate, we earn from qualifying purchases.
        </footer>
      </main>
    </div>
  );
}

const TopBar = () => (
  <div className="absolute top-4 right-4 flex gap-2 z-10">
    <Link to="/admin">
      <Button variant="ghost" size="icon" aria-label="Admin">
        <Settings className="h-4 w-4" />
      </Button>
    </Link>
    <ThemeToggle />
  </div>
);

const PageHeader = () => (
  <header className="mb-10 rounded-[20px] border border-border/70 bg-card shadow-[0_8px_30px_rgb(17,24,39,0.06)] p-6 sm:p-8 [container-type:inline-size]">
    <h1 className="hero-title font-extrabold italic tracking-[-0.02em] bg-gradient-to-r from-[#ff8a3d] via-[#ff3d77] to-[#7a3dff] bg-clip-text text-transparent dark:from-[#ffb066] dark:via-[#ff6aa1] dark:to-[#9b8cff] whitespace-nowrap leading-tight text-[clamp(1rem,7.4cqi,2.6rem)] text-left">
      Shortlisted Amazon Deals
    </h1>
    <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 mt-5">
      <span className="h-1.5 w-1.5 rounded-full bg-primary" />
      <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/70">
        Unlock curated deals matched to your search
      </span>
    </div>
  </header>
);

const KeywordChips = ({ items }: { items: HomeData["keywords"] }) => (
  <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
    {items.map((k) => (
      <a
        key={k.id}
        href={k.affiliate_url}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-[14px] border border-keyword-chip-border px-4 py-3 text-sm font-medium text-keyword-chip-foreground text-center transition-colors hover:border-amazon inline-flex items-center justify-center gap-2 bg-keyword-chip"
      >
        {k.emoji && <span aria-hidden>{k.emoji}</span>}
        <span>{k.label}</span>
      </a>
    ))}
  </div>
);

type DepartmentChipsProps = {
  departments: Department[];
  value: string;
  onChange: (id: string) => void;
  disabled?: boolean;
};

const DepartmentChips = ({ departments, value, onChange, disabled }: DepartmentChipsProps) => {
  const options = [{ id: "any", name: "Any" } as const, ...departments];
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground/80">Department</label>
      <div className="flex flex-wrap gap-2 sm:gap-3">
        {options.map((d) => (
          <button
            key={d.id}
            type="button"
            onClick={() => onChange(d.id)}
            disabled={disabled}
            className={chipClasses(value === d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>
    </div>
  );
};

type ChipGroupProps = {
  label: string;
  tiers: Tier[];
  value: string;
  onChange: (v: string) => void;
};

function ChipGroup({ label, tiers, value, onChange }: ChipGroupProps) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className={cn("grid gap-2 sm:gap-3", gridColsForCount(tiers.length))}>
        {tiers.map((t) => {
          const selected = value === t.value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.value)}
              className={cn(
                chipClasses(selected),
                "relative px-3 py-4 flex flex-col items-center justify-center gap-1.5 min-h-[80px]",
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center border transition-colors",
                  selected ? "border-amazon bg-amazon text-amazon-foreground" : "border-border",
                )}
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
              <span className="text-center leading-tight">{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
