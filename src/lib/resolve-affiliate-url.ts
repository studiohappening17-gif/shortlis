import { supabase } from "@/integrations/supabase/client";

type ResolveArgs = {
  deptId: string;
  discount: string;
  price: string;
  review: string;
};

export async function resolveAffiliateUrl({
  deptId,
  discount,
  price,
  review,
}: ResolveArgs): Promise<string> {
  const fallbackRes = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "fallback_url")
    .maybeSingle();
  const globalFallback = fallbackRes.data?.value ?? "https://www.amazon.com";

  let target: string | null = null;

  if (discount !== "any" && price !== "any" && review !== "any") {
    const baseQuery = supabase
      .from("affiliate_links")
      .select("affiliate_url")
      .eq("discount_range", discount)
      .eq("price_range", price)
      .eq("review_range", review);
    const scoped = deptId !== "any" ? baseQuery.eq("dept_id", deptId) : baseQuery.is("dept_id", null);
    const { data } = await scoped.maybeSingle();
    if (data?.affiliate_url) target = data.affiliate_url;
  }

  if (!target && deptId !== "any") {
    const { data } = await supabase
      .from("departments")
      .select("default_affiliate_url")
      .eq("id", deptId)
      .maybeSingle();
    if (data?.default_affiliate_url) target = data.default_affiliate_url;
  }

  return target ?? globalFallback;
}
