CREATE TABLE public.keywords (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label text NOT NULL,
  affiliate_url text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.keywords ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read keywords" ON public.keywords FOR SELECT USING (true);
CREATE POLICY "Admins write keywords" ON public.keywords FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

INSERT INTO public.keywords (label, affiliate_url, sort_order) VALUES
  ('Giftable tech under $30', 'https://www.amazon.com', 0),
  ('K-beauty products under $20', 'https://www.amazon.com', 1),
  ('Mother''s Day gift under $30', 'https://www.amazon.com', 2),
  ('NYC apartment kitchen finds', 'https://www.amazon.com', 3);