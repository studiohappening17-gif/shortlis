
-- Create review_tiers table
CREATE TABLE public.review_tiers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  value text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.review_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read review_tiers" ON public.review_tiers FOR SELECT USING (true);
CREATE POLICY "Admins write review_tiers" ON public.review_tiers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seed default review tiers
INSERT INTO public.review_tiers (label, value, sort_order) VALUES
  ('Any', 'any', 0),
  ('4★ + only', '4plus', 1);

-- Add review_range to affiliate_links
ALTER TABLE public.affiliate_links ADD COLUMN IF NOT EXISTS review_range text NOT NULL DEFAULT 'any';

-- Reset discount_tiers to only Any + 50%+
DELETE FROM public.discount_tiers;
INSERT INTO public.discount_tiers (label, value, sort_order) VALUES
  ('Any', 'any', 0),
  ('50%+ deals only', '50plus', 1);
