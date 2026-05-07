## SEO Optimization Plan

Goal: turn the single-page deal finder into a scalable, SEO-friendly site that ranks for high-intent seasonal shopping keywords, with new categories addable from the admin dashboard.

### 1. Scalable data model (admin-managed)

Create a new table `seo_categories` so non-developers can add seasonal landing pages from the admin dashboard without code changes.

```text
seo_categories
  id uuid pk
  slug text unique          -- e.g. "mothers-day-gifts"
  title text                -- H1 + <title>
  meta_title text           -- <title> override (<=60 chars)
  meta_description text     -- <=160 chars
  h1 text
  intro_html text           -- short rich intro paragraph
  body_html text            -- longer SEO copy with H2/H3
  keywords text[]           -- semantic keywords
  affiliate_url text        -- Amazon affiliate target for primary CTA
  hero_image_url text
  og_image_url text
  is_published boolean default true
  is_seasonal boolean default true
  season_start date null
  season_end date null
  sort_order int default 0
  updated_at timestamptz
```

RLS: public SELECT (only `is_published = true`), admin ALL (mirrors existing tables).

Seed rows for the 15 requested keywords:
Mother's Day Gifts, Holiday Gifts, Christmas Decorations, Valentine's Day Gifts, Black Friday Deals, Beachwear Deals, Sunscreen Deals, Winter Boots, Halloween Costumes, Lego Sets Deals, Father's Day Gifts, Cyber Monday Deals, Amazon Prime Day Deals, Memorial Day Deals, Independence Day Deals.

### 2. New routes (TanStack file-based)

Each gets its own `head()` with unique title, description, OG/Twitter tags, canonical, and JSON-LD.

```text
src/routes/
  index.tsx                           (kept; SEO-improved)
  deals.tsx                           /deals  — hub page linking all categories
  deals.$slug.tsx                     /deals/{slug} — dynamic SEO landing pages
  sitemap[.]xml.tsx                   /sitemap.xml — generated from departments + seo_categories
  robots[.]txt.tsx                    /robots.txt
```

`deals.$slug.tsx` loads the row from `seo_categories` by slug, renders H1 / intro / body / FAQ / CTA button (opens affiliate URL), and emits `Product`/`ItemList` + `BreadcrumbList` JSON-LD.

`/deals` hub lists all published categories as internal links (boosts internal linking + crawl depth = 2 to every landing page).

### 3. Per-page SEO improvements

- **Root** (`__root.tsx`): broaden default title/description, add `theme-color`, `og:site_name`, `twitter:card=summary_large_image`, default `og:image`, canonical link helper.
- **Index** (`/`): change H1 from "Shortlisted Amazon Deals" to a keyword-rich "Find the Best Amazon Deals & Discounts". Add an H2 section "Popular Seasonal Deals" linking to all `/deals/{slug}` pages (internal linking). Add `WebSite` + `SearchAction` JSON-LD.
- **Headings**: enforce single H1 per route, H2 for section labels (Department, Discount, Reviews, Price → currently `<label>`; keep as labels but add visually-hidden H2 "Filter Amazon Deals"). Landing pages use H1 → H2 (Why / Top picks / FAQ) → H3 (per item).
- **Image alt text**: every `<img>` (hero, OG previews, keyword chips if image-based) gets descriptive alt derived from category title.
- **URL slugs**: kebab-case slugs stored in DB, validated on insert.

### 4. Structured data (rich results)

- Root: `Organization` JSON-LD.
- Home: `WebSite` + `SearchAction`.
- `/deals`: `BreadcrumbList` + `CollectionPage`.
- `/deals/{slug}`: `BreadcrumbList` + `ItemList` of featured deals + `FAQPage` (questions stored on category row, optional).

### 5. Crawling & indexing

- `robots.txt` allows all, points to `/sitemap.xml`, disallows `/admin` and `/login`.
- `sitemap.xml` server route queries `seo_categories` (published) + static routes, sets `lastmod` from `updated_at`.
- Add `<link rel="canonical">` per route via `head().links`.

### 6. Performance / Core Web Vitals / Mobile

- Preload hero font subset (already preconnected; add `&display=swap` already done).
- Add `loading="lazy"` and `decoding="async"` to non-hero images; hero gets `fetchpriority="high"`.
- Inline critical CSS already via Vite; ensure landing-page images use width/height to prevent CLS.
- Existing TanStack loader cache (5 min) is kept; landing-page loader uses same `staleTime`.
- Verify viewport meta (present) and tap target sizes (existing chips ≥44px — OK).

### 7. Admin dashboard updates

Add a new "SEO Categories" section in `src/routes/admin.tsx`:
- Table list with slug, title, published toggle, sort order.
- Create/edit form for all `seo_categories` fields (title, meta, H1, intro, body, keywords as comma list, affiliate URL, hero/og image URLs, season dates).
- Reuses existing `runMutation` / `confirmAndDelete` helpers from `src/lib/admin-api.ts`.

### 8. Open Graph / social

Per-route in `head()`:
- `og:title`, `og:description`, `og:type` (website / article), `og:url`, `og:image` (category `og_image_url` or `hero_image_url`), `og:site_name`.
- `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`, `twitter:image`.

### Files to add / change

Add:
- `supabase` migration: create `seo_categories` table + RLS + seed 15 rows.
- `src/lib/seo.ts` — helpers: `buildMeta({title, description, url, image, type})`, `jsonLd(obj)`.
- `src/routes/deals.tsx` — hub page.
- `src/routes/deals.$slug.tsx` — dynamic landing page.
- `src/routes/sitemap[.]xml.tsx` — server route.
- `src/routes/robots[.]txt.tsx` — server route.

Edit:
- `src/routes/__root.tsx` — richer defaults, OG/Twitter tags, organization JSON-LD.
- `src/routes/index.tsx` — keyword-rich H1, internal links to `/deals/*`, JSON-LD, image alt.
- `src/routes/admin.tsx` — add SEO Categories CRUD.
- `src/lib/types.ts` — add `SeoCategory` type.
- `src/lib/admin-api.ts` — fetch/upsert/delete helpers for `seo_categories`.

### Out of scope (explicitly)

- No content-writing for hundreds of long-form articles; seeded categories ship with concise (~150-word) intros so they're indexable. Admin can expand any time.
- No third-party analytics or Search Console verification (user-specific).
