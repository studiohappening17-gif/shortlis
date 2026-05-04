## Amazon Discount Finder

A search tool that routes shoppers to curated Amazon affiliate URLs based on department, discount tier, and price range, plus an admin dashboard to manage everything.

### Public search page (`/`)

Pixel-faithful rebuild of the mockup:
- Centered card with "Amazon Discount Finder" heading + subtitle
- **Department** dropdown (loaded from DB, plus "Any")
- **Discount** chip selector (Any / 10%+ / 25%+ / 50%+ / 70%+ — managed in admin)
- **Price** chip selector ($Any / Under $15 / $30 / $100 / $200 — managed in admin)
- Selected chips highlighted in Amazon yellow with checkmark
- Yellow "Search" CTA
- Dark/Light mode toggle (sun/moon) in top-right; persists in localStorage; both themes polished
- Fully responsive (chips wrap on mobile)

**Search behavior:** On submit, query `affiliate_links` for the matching `dept_id` + `discount_range` + `price_range`. If found → open `affiliate_url` in a new tab. If "Any" is chosen on any field, or no match exists → open the configured fallback URL.

### Admin dashboard (`/admin`)

Protected by Supabase email/password auth + an `admin` role (separate `user_roles` table, security-definer `has_role` function — no client-side role checks). Non-admins see "Unauthorized".

Three tabs:
1. **Departments** — table with add/edit/delete (name field)
2. **Affiliate Links** — table listing dept + discount + price + URL; add/edit form uses dropdowns populated from departments and from the discount/price option tables
3. **Settings** — edit the fallback Amazon URL; manage available **Discount tiers** and **Price tiers** (label + value used as the matching key)

Login page at `/login`. First admin is bootstrapped by inserting their `user_id` into `user_roles` (instructions shown in chat after signup).

### Database (Supabase / Lovable Cloud)

- `departments` (id, name, created_at)
- `discount_tiers` (id, label, value, sort_order)
- `price_tiers` (id, label, value, sort_order)
- `affiliate_links` (id, dept_id → departments, discount_range, price_range, affiliate_url, created_at)
- `app_settings` (key, value) — stores `fallback_url`
- `user_roles` (id, user_id, role enum) + `has_role()` security-definer function

Seeded with the tiers shown in the mockup and a placeholder fallback URL.

### Technical notes

- TanStack Start file-based routes: `/`, `/login`, `/admin` (under `_authenticated/_admin` layout guards)
- Search read uses public Supabase client (RLS allows anonymous SELECT on `departments`, `discount_tiers`, `price_tiers`, `affiliate_links`, `app_settings`)
- All admin writes go through `createServerFn` handlers protected by `requireSupabaseAuth` + `has_role(user, 'admin')` check
- shadcn components: Card, Select, Button, Input, Table, Dialog, Tabs, Switch (for theme), Sonner toasts
- Theme via `class="dark"` on `<html>`; toggle component stores preference

### Out of scope

- Calling Amazon's API / live product results (the app routes to curated affiliate URLs, per spec)
- Self-serve admin signup (admin role granted manually after first signup for security)