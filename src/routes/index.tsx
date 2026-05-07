import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, Search, Settings } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { chipClasses, gridColsForCount } from "@/lib/chip-styles";
import { resolveAffiliateUrl } from "@/lib/resolve-affiliate-url";
import type { Department, Keyword, Tier } from "@/lib/types";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type HomeData = {
  departments: Department[];
  discountTiers: Tier[];
  priceTiers: Tier[];
  reviewTiers: Tier[];
  keywords: Pick<Keyword, "id" | "label" | "affiliate_url" | "emoji">[];
};

const EMPTY_DATA: HomeData = {
  departments: [],
  discountTiers: [],
  priceTiers: [],
  reviewTiers: [],
  keywords: [],
};

const loadHomeData = async (): Promise<HomeData> => {
  const [d, dt, pt, rt, kw] = await Promise.all([
    supabase.from("departments").select("id,name,sort_order,default_affiliate_url").order("sort_order").order("name"),
    supabase.from("discount_tiers").select("*").order("sort_order"),
    supabase.from("price_tiers").select("*").order("sort_order"),
    supabase.from("review_tiers").select("*").order("sort_order"),
    supabase.from("keywords").select("id,label,affiliate_url,emoji").order("sort_order"),
  ]);
  return {
    departments: (d.data as Department[]) ?? [],
    discountTiers: dt.data ?? [],
    priceTiers: pt.data ?? [],
    reviewTiers: rt.data ?? [],
    keywords: kw.data ?? [],
  };
};

function HomePage() {
  const [data, setData] = useState<HomeData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [dept, setDept] = useState("any");
  const [discount, setDiscount] = useState("any");
  const [price, setPrice] = useState("any");
  const [review, setReview] = useState("any");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadHomeData().then((d) => {
      setData(d);
      if (d.discountTiers[0]) setDiscount(d.discountTiers[0].value);
      if (d.priceTiers[0]) setPrice(d.priceTiers[0].value);
      if (d.reviewTiers[0]) setReview(d.reviewTiers[0].value);
      setLoading(false);
    });
  }, []);

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

  const { departments, discountTiers, priceTiers, reviewTiers, keywords } = data;

  return (
    <div className="min-h-screen bg-background relative">
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
  <header className="mb-10 rounded-[20px] border border-border/70 bg-card shadow-[0_8px_30px_rgb(17,24,39,0.06)] p-6 sm:p-8">
    <h1 className="hero-title font-extrabold italic tracking-[-0.02em] bg-gradient-to-r from-[#ff8a3d] via-[#ff3d77] to-[#7a3dff] bg-clip-text text-transparent dark:from-[#ffb066] dark:via-[#ff6aa1] dark:to-[#9b8cff] whitespace-nowrap overflow-hidden text-ellipsis max-w-full block text-[clamp(1.125rem,7vw,3rem)] sm:text-[clamp(2rem,5.5vw,3.25rem)] leading-tight">
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
