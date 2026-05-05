## Add Keywords Section (admin-managed)

### 1. Database
New migration creating `keywords` table:
- `id uuid pk default gen_random_uuid()`
- `label text not null`
- `affiliate_url text not null`
- `sort_order int not null default 0`
- `created_at timestamptz default now()`

RLS:
- Public SELECT (true)
- Admin ALL (`has_role(auth.uid(),'admin')`)

Seed with 4 example rows (Giftable tech under $30, K-beauty products under $20, Mother's Day gift under $30, NYC apartment kitchen finds) using placeholder Amazon URL.

### 2. Homepage (`src/routes/index.tsx`)
Between the header card and the search card, render a new card containing keyword chips.
- Fetch `keywords` (ordered by `sort_order`) in the existing `Promise.all` load.
- Layout: `grid grid-cols-2 gap-2 sm:gap-3` (4 items → 2x2 on mobile, can stay 2 cols on small screens; switches to `sm:grid-cols-2` for visual consistency with reference). Each chip is a clickable button styled like the existing chip buttons (rounded-[14px] border, hover state) but acts as a link — clicking opens the keyword's `affiliate_url` in a new tab.
- Section heading: "Trending searches" (or similar) using the same label style as Department/Discount.
- Style: matches the card shell + chip design tokens already used.

### 3. Admin panel (`src/routes/admin.tsx`)
- Add a new tab `"Keywords"` to the TabsList.
- New `KeywordsTab` component with table (Label, URL, Order, Actions) + Add/Edit dialog (label, URL, sort_order) + delete confirm. Mirrors the structure of `DepartmentsTab` / `LinksTab`.
- Independent of links — saved via its own table.

### 4. Types
`src/integrations/supabase/types.ts` will be regenerated automatically after the migration to include the `keywords` table.

### Files touched
- `supabase/migrations/<timestamp>_keywords.sql` (new)
- `src/routes/index.tsx`
- `src/routes/admin.tsx`
