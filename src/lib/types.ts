export type Department = {
  id: string;
  name: string;
  sort_order: number;
  default_affiliate_url: string | null;
};

export type Tier = {
  id: string;
  label: string;
  value: string;
  sort_order: number;
};

export type AffiliateLink = {
  id: string;
  dept_id: string | null;
  discount_range: string;
  price_range: string;
  review_range: string;
  affiliate_url: string;
};

export type Keyword = {
  id: string;
  label: string;
  affiliate_url: string;
  sort_order: number;
  emoji: string | null;
};

export type TierTable = "discount_tiers" | "price_tiers" | "review_tiers";

export type SeoCategory = {
  id: string;
  slug: string;
  title: string;
  meta_title: string;
  meta_description: string;
  h1: string;
  intro_html: string;
  body_html: string;
  keywords: string[];
  affiliate_url: string;
  hero_image_url: string | null;
  og_image_url: string | null;
  is_published: boolean;
  is_seasonal: boolean;
  season_start: string | null;
  season_end: string | null;
  sort_order: number;
  updated_at: string;
};
