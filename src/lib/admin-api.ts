import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { AffiliateLink, Department, Keyword, SeoCategory, Tier, TierTable } from "./types";

export const fetchSeoCategories = async (): Promise<SeoCategory[]> => {
  const { data } = await supabase
    .from("seo_categories")
    .select("*")
    .order("sort_order");
  return (data as SeoCategory[]) ?? [];
};

export const fetchDepartments = async (): Promise<Department[]> => {
  const { data } = await supabase
    .from("departments")
    .select("*")
    .order("sort_order")
    .order("name");
  return (data as Department[]) ?? [];
};

export const fetchTiers = async (table: TierTable): Promise<Tier[]> => {
  const { data } = await supabase.from(table).select("*").order("sort_order");
  return (data as Tier[]) ?? [];
};

export const fetchKeywords = async (): Promise<Keyword[]> => {
  const { data } = await supabase.from("keywords").select("*").order("sort_order");
  return (data as Keyword[]) ?? [];
};

export const fetchAffiliateLinks = async (): Promise<AffiliateLink[]> => {
  const { data } = await supabase
    .from("affiliate_links")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as AffiliateLink[]) ?? [];
};

export const fetchFallbackUrl = async (): Promise<string> => {
  const { data } = await supabase
    .from("app_settings")
    .select("value")
    .eq("key", "fallback_url")
    .maybeSingle();
  return data?.value ?? "";
};

export const upsertFallbackUrl = (value: string) =>
  supabase.from("app_settings").upsert({
    key: "fallback_url",
    value,
    updated_at: new Date().toISOString(),
  });

/** Awaits a Supabase mutation, toasting errors / success. Returns ok flag. */
export async function runMutation(
  promise: PromiseLike<{ error: { message: string } | null }>,
  opts: { successMsg?: string } = {},
): Promise<{ ok: boolean }> {
  const { error } = await promise;
  if (error) {
    toast.error(error.message);
    return { ok: false };
  }
  if (opts.successMsg) toast.success(opts.successMsg);
  return { ok: true };
}

export async function confirmAndDelete(
  table: "departments" | "affiliate_links" | "keywords" | "seo_categories" | TierTable,
  id: string,
  message = "Delete this item?",
): Promise<boolean> {
  if (!confirm(message)) return false;
  const { ok } = await runMutation(supabase.from(table).delete().eq("id", id), {
    successMsg: "Deleted",
  });
  return ok;
}
