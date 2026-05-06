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
