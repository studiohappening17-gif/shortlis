
CREATE TABLE public.seo_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  meta_title text NOT NULL,
  meta_description text NOT NULL,
  h1 text NOT NULL,
  intro_html text NOT NULL DEFAULT '',
  body_html text NOT NULL DEFAULT '',
  keywords text[] NOT NULL DEFAULT '{}',
  affiliate_url text NOT NULL,
  hero_image_url text,
  og_image_url text,
  is_published boolean NOT NULL DEFAULT true,
  is_seasonal boolean NOT NULL DEFAULT true,
  season_start date,
  season_end date,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_seo_categories_slug ON public.seo_categories(slug);
CREATE INDEX idx_seo_categories_published ON public.seo_categories(is_published, sort_order);

ALTER TABLE public.seo_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read published seo_categories"
  ON public.seo_categories FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins write seo_categories"
  ON public.seo_categories FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.touch_seo_categories_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seo_categories_updated_at
  BEFORE UPDATE ON public.seo_categories
  FOR EACH ROW EXECUTE FUNCTION public.touch_seo_categories_updated_at();

INSERT INTO public.seo_categories (slug, title, meta_title, meta_description, h1, intro_html, keywords, affiliate_url, sort_order) VALUES
('mothers-day-gifts', 'Mother''s Day Gifts', 'Best Mother''s Day Gifts 2026 — Top Amazon Deals', 'Shop the best Mother''s Day gifts on Amazon. Curated deals on jewelry, flowers, beauty, and thoughtful gifts moms will love — updated daily.', 'Best Mother''s Day Gifts on Amazon', '<p>Find heartfelt Mother''s Day gifts at the best prices on Amazon — from personalized jewelry to spa sets, kitchen gadgets and cozy loungewear, all hand-picked for great savings.</p>', ARRAY['mothers day gifts','gifts for mom','mothers day deals','mom gift ideas','best gifts for mothers'], 'https://www.amazon.com/s?k=mothers+day+gifts&tag=', 10),
('holiday-gifts', 'Holiday Gifts', 'Holiday Gifts 2026 — Best Amazon Gift Deals', 'Discover the best holiday gift ideas on Amazon. Top picks across electronics, toys, home, and fashion with the season''s biggest discounts.', 'Best Holiday Gifts on Amazon', '<p>Shop the season''s most-wanted holiday gifts on Amazon. From stocking stuffers under $25 to premium splurges, we surface the best-rated, best-priced deals every day.</p>', ARRAY['holiday gifts','holiday gift ideas','christmas gifts','holiday deals','gift guide'], 'https://www.amazon.com/s?k=holiday+gifts&tag=', 20),
('christmas-decorations', 'Christmas Decorations', 'Christmas Decorations 2026 — Best Deals on Amazon', 'Save on Christmas decorations on Amazon — trees, lights, ornaments, wreaths, and outdoor décor at the best prices of the season.', 'Best Christmas Decorations Deals', '<p>Deck the halls for less. Browse top-rated Christmas trees, twinkling lights, ornaments, garlands and outdoor inflatables — all curated for the deepest Amazon discounts.</p>', ARRAY['christmas decorations','christmas lights','christmas tree','holiday decor','xmas ornaments'], 'https://www.amazon.com/s?k=christmas+decorations&tag=', 30),
('valentines-day-gifts', 'Valentine''s Day Gifts', 'Valentine''s Day Gifts 2026 — Romantic Amazon Deals', 'Romantic Valentine''s Day gift ideas on Amazon. Jewelry, chocolates, flowers, and personalized gifts for him and her — all on sale.', 'Best Valentine''s Day Gifts on Amazon', '<p>Make Valentine''s Day unforgettable with curated gifts for him and her — necklaces, watches, gourmet chocolates, plush bouquets and personalized keepsakes at top Amazon prices.</p>', ARRAY['valentines day gifts','valentine gifts for him','valentine gifts for her','romantic gifts','valentines deals'], 'https://www.amazon.com/s?k=valentines+day+gifts&tag=', 40),
('black-friday-deals', 'Black Friday Deals', 'Black Friday Deals 2026 — Top Amazon Discounts', 'The biggest Black Friday deals on Amazon. Up to 80% off electronics, home, fashion, toys, and more — updated in real time.', 'Best Black Friday Deals on Amazon', '<p>Black Friday''s deepest Amazon price drops, all in one place. We track lightning deals across TVs, laptops, headphones, kitchen, toys and fashion so you never miss a markdown.</p>', ARRAY['black friday deals','black friday amazon','black friday sale','best black friday deals','bf deals'], 'https://www.amazon.com/s?k=black+friday+deals&tag=', 50),
('beachwear-deals', 'Beachwear Deals', 'Beachwear Deals — Swimsuits, Cover-Ups & More on Amazon', 'Save on beachwear at Amazon — swimsuits, bikinis, cover-ups, beach towels and sandals from top-rated brands at sale prices.', 'Best Beachwear Deals on Amazon', '<p>Stock up for sun season with discounted swimsuits, bikinis, rash guards, cover-ups, sandals and beach towels — only the best-reviewed Amazon picks make our list.</p>', ARRAY['beachwear deals','swimsuits sale','bikini deals','beach cover ups','summer fashion'], 'https://www.amazon.com/s?k=beachwear&tag=', 60),
('sunscreen-deals', 'Sunscreen Deals', 'Sunscreen Deals — Best SPF Sales on Amazon', 'Top-rated sunscreens on sale at Amazon. SPF 30, 50, mineral, reef-safe, and face sunscreens at the lowest prices.', 'Best Sunscreen Deals on Amazon', '<p>Protect your skin and your wallet. Browse dermatologist-loved sunscreens — mineral, chemical, reef-safe, kids and face formulas — all marked down on Amazon.</p>', ARRAY['sunscreen deals','spf 50','mineral sunscreen','reef safe sunscreen','best sunscreen'], 'https://www.amazon.com/s?k=sunscreen&tag=', 70),
('winter-boots', 'Winter Boots', 'Winter Boots — Best Amazon Deals on Snow & Insulated Boots', 'Shop discounted winter boots on Amazon. Waterproof, insulated, and snow boots for women, men, and kids at top prices.', 'Best Winter Boots Deals on Amazon', '<p>Stay warm and dry without overpaying. Discover top-rated waterproof, insulated and snow boots for women, men and kids — all curated for the best Amazon discounts.</p>', ARRAY['winter boots','snow boots','waterproof boots','insulated boots','womens winter boots'], 'https://www.amazon.com/s?k=winter+boots&tag=', 80),
('halloween-costumes', 'Halloween Costumes', 'Halloween Costumes 2026 — Best Deals on Amazon', 'Save on Halloween costumes for adults, kids, couples, and pets on Amazon. Trending costumes, accessories, and décor.', 'Best Halloween Costumes Deals', '<p>From classic spooky to viral trending looks — shop Amazon''s best-priced Halloween costumes for adults, kids, couples and pets, plus accessories and décor.</p>', ARRAY['halloween costumes','halloween costumes for kids','adult halloween costumes','couples costumes','halloween 2026'], 'https://www.amazon.com/s?k=halloween+costumes&tag=', 90),
('lego-sets-deals', 'Lego Sets Deals', 'Lego Sets Deals — Best Amazon Discounts on Lego', 'The best Lego sets deals on Amazon. Star Wars, Technic, Creator, City, Friends and Harry Potter sets at the lowest prices.', 'Best Lego Sets Deals on Amazon', '<p>Build more for less. Track Amazon price drops on Lego Star Wars, Technic, Creator, City, Friends and Harry Potter sets — perfect for gifts and collectors.</p>', ARRAY['lego deals','lego sets sale','lego star wars deals','lego technic','cheap lego'], 'https://www.amazon.com/s?k=lego+sets&tag=', 100),
('fathers-day-gifts', 'Father''s Day Gifts', 'Father''s Day Gifts 2026 — Best Amazon Deals for Dad', 'Top Father''s Day gift ideas on Amazon — tools, gadgets, grilling, watches, and personalized gifts dad will actually use.', 'Best Father''s Day Gifts on Amazon', '<p>Skip the boring tie. Find Father''s Day gifts dads actually want — tools, smart gadgets, grilling gear, watches and personalized keepsakes — all at top Amazon deals.</p>', ARRAY['fathers day gifts','gifts for dad','fathers day deals','dad gift ideas','best gifts for fathers'], 'https://www.amazon.com/s?k=fathers+day+gifts&tag=', 110),
('cyber-monday-deals', 'Cyber Monday Deals', 'Cyber Monday Deals 2026 — Top Amazon Discounts', 'The best Cyber Monday deals on Amazon — electronics, laptops, headphones, smart home, and more at record-low prices.', 'Best Cyber Monday Deals on Amazon', '<p>Cyber Monday''s biggest Amazon price drops, tracked in real time. Save on laptops, TVs, headphones, smart home and gaming — limited-time only.</p>', ARRAY['cyber monday deals','cyber monday amazon','cyber monday sale','best cyber monday deals','cm deals'], 'https://www.amazon.com/s?k=cyber+monday+deals&tag=', 120),
('amazon-prime-day-deals', 'Amazon Prime Day Deals', 'Amazon Prime Day Deals — Best Discounts of the Year', 'The best Amazon Prime Day deals — exclusive Prime member discounts on electronics, home, fashion, beauty, and more.', 'Best Amazon Prime Day Deals', '<p>Don''t miss the year''s biggest Prime member discounts. Track lightning deals, daily deals and exclusive markdowns across every Amazon category.</p>', ARRAY['amazon prime day','prime day deals','prime day sale','best prime day deals','amazon deals'], 'https://www.amazon.com/s?k=prime+day+deals&tag=', 130),
('memorial-day-deals', 'Memorial Day Deals', 'Memorial Day Deals — Top Amazon Sales', 'Shop Memorial Day sales on Amazon — discounts on patio furniture, grills, mattresses, appliances, and summer essentials.', 'Best Memorial Day Deals on Amazon', '<p>Kick off summer with Memorial Day''s best Amazon deals — patio furniture, grills, mattresses, large appliances and outdoor essentials at deep discounts.</p>', ARRAY['memorial day deals','memorial day sale','memorial day amazon','memorial day mattress','memorial day grill'], 'https://www.amazon.com/s?k=memorial+day+deals&tag=', 140),
('independence-day-deals', 'Independence Day Deals', '4th of July Deals — Best Amazon Independence Day Sales', 'Top 4th of July deals on Amazon — TVs, appliances, outdoor gear, patriotic décor, and grilling essentials at sale prices.', 'Best 4th of July Deals on Amazon', '<p>Celebrate with savings. Shop Amazon''s top 4th of July deals on TVs, appliances, outdoor gear, patriotic décor and grilling must-haves.</p>', ARRAY['4th of july deals','independence day deals','july 4th sale','fourth of july deals','july 4 amazon'], 'https://www.amazon.com/s?k=4th+of+july+deals&tag=', 150);
