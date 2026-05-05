import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, Loader2, Search, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: HomePage,
});

type Tier = { id: string; label: string; value: string; sort_order: number };
type Dept = { id: string; name: string };

function HomePage() {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [discountTiers, setDiscountTiers] = useState<Tier[]>([]);
  const [priceTiers, setPriceTiers] = useState<Tier[]>([]);
  const [dept, setDept] = useState("any");
  const [discount, setDiscount] = useState("any");
  const [price, setPrice] = useState("any");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("departments").select("id,name").order("name"),
      supabase.from("discount_tiers").select("*").order("sort_order"),
      supabase.from("price_tiers").select("*").order("sort_order"),
    ]).then(([d, dt, pt]) => {
      setDepartments(d.data ?? []);
      setDiscountTiers(dt.data ?? []);
      setPriceTiers(pt.data ?? []);
      // ensure first option selected
      if (dt.data?.length) setDiscount(dt.data[0].value);
      if (pt.data?.length) setPrice(pt.data[0].value);
      setLoading(false);
    });
  }, []);

  const handleSearch = async () => {
    setSearching(true);
    try {
      const fallback = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "fallback_url")
        .maybeSingle();
      const fallbackUrl = fallback.data?.value ?? "https://www.amazon.com";

      let target = fallbackUrl;
      if (dept !== "any" && discount !== "any" && price !== "any") {
        const { data } = await supabase
          .from("affiliate_links")
          .select("affiliate_url")
          .eq("dept_id", dept)
          .eq("discount_range", discount)
          .eq("price_range", price)
          .maybeSingle();
        if (data?.affiliate_url) target = data.affiliate_url;
      }
      window.open(target, "_blank", "noopener,noreferrer");
    } catch (e) {
      toast.error("Search failed");
      console.error(e);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <Link to="/admin">
          <Button variant="ghost" size="icon" aria-label="Admin">
            <Settings className="h-4 w-4" />
          </Button>
        </Link>
        <ThemeToggle />
      </div>

      <main className="mx-auto max-w-xl px-4 py-12 sm:py-16">
        <header className="mb-10 rounded-[20px] border border-border/70 bg-card shadow-[0_8px_30px_rgb(17,24,39,0.06)] p-6 sm:p-8">
          <h1 className="text-4xl font-semibold tracking-[-0.02em] text-foreground sm:text-5xl">
            Shortlisted Amazon Deals
          </h1>
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 mt-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="text-[11px] font-semibold tracking-[0.14em] uppercase text-foreground/70">
              Filter and explore curated Amazon deals tailored to your search
            </span>
          </div>
        </header>

        <div className="rounded-[20px] border border-border/70 bg-card shadow-[0_8px_30px_rgb(17,24,39,0.06)] p-6 sm:p-8 space-y-6">
          {/* Department */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Department</label>
            <Select value={dept} onValueChange={setDept} disabled={loading}>
              <SelectTrigger className="h-12 text-base rounded-[14px] border-border hover:border-amazon focus:border-amazon transition-colors">
                <SelectValue placeholder="Any" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Discount */}
          <ChipGroup
            label="Discount"
            tiers={discountTiers}
            value={discount}
            onChange={setDiscount}
          />

          {/* Price */}
          <ChipGroup label="Price" tiers={priceTiers} value={price} onChange={setPrice} />

          <Button
            onClick={handleSearch}
            disabled={searching || loading}
            className="w-full h-14 text-base font-medium rounded-[14px] bg-amazon hover:bg-amazon-hover active:brightness-95 text-amazon-foreground shadow-sm transition-colors"
          >
            {searching ? <Loader2 className="h-5 w-5 animate-spin" /> : (
              <><Search className="h-4 w-4 mr-2" /> Search</>
            )}
          </Button>
        </div>

        <footer className="mt-10 text-center text-xs text-muted-foreground/80">
          Affiliate disclosure: As an Amazon Associate, we earn from qualifying purchases.
        </footer>
      </main>
    </div>
  );
}

function ChipGroup({
  label,
  tiers,
  value,
  onChange,
}: {
  label: string;
  tiers: Tier[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      <label className="text-sm font-medium text-foreground/80">{label}</label>
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
        {tiers.map((t) => {
          const selected = value === t.value;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onChange(t.value)}
              className={cn(
                "relative rounded-[14px] border px-3 py-4 text-sm font-medium transition-all",
                "flex flex-col items-center justify-center gap-1.5 min-h-[80px]",
                selected
                  ? "border-chip-selected-border bg-chip-selected-bg text-chip-selected-text shadow-sm"
                  : "border-border bg-card text-foreground/75 hover:border-amazon hover:shadow-sm"
              )}
            >
              <span
                className={cn(
                  "h-5 w-5 rounded-full flex items-center justify-center border transition-colors",
                  selected
                    ? "border-amazon bg-amazon text-amazon-foreground"
                    : "border-border"
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