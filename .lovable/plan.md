## Goal
Add a reusable `<Seo />` component that any route can render to set `<title>`, `<meta name="description">`, `<meta name="keywords">`, canonical, and Open Graph / Twitter tags — with sensible defaults applied when a page omits them.

## Approach
TanStack Start already manages `<head>` via the route `head()` API + `<HeadContent />` (rendered in `src/routes/__root.tsx`). React Helmet is **not compatible** with TanStack Start's SSR head pipeline and would double-render tags, so we'll build the component on top of the existing `head()` system instead. Functionally identical to Helmet for the user, but SSR-safe.

## Changes

### 1. `src/components/Seo.tsx` (new)
Reusable component used inside any route's `head()` builder OR rendered as JSX (via React 19's native `<title>`/`<meta>` hoisting as a fallback for client-only routes).

```tsx
<Seo
  title="Black Friday Deals | ShortListed"
  description="..."
  keywords={["black friday", "..."]}
  path="/deals/black-friday"
  image="/og/black-friday.png"
/>
```

Props (all optional — defaults applied):
- `title` → default: `"Best Gift Idea under 30 | ShortListed"`
- `description` → default: `"Discover affordable Amazon finds and top-rated gift recommendations."`
- `keywords` → default: `["Best Gift Idea under 30", "Affordable Amazon Finds 2026", "Amazon Affiliate Recommendations"]`
- `path`, `image`, `type`, `noindex`

Internally renders React 19 native hoisted tags: `<title>`, `<meta name="description">`, `<meta name="keywords">`, `<link rel="canonical">`, full OG + Twitter set, optional `<meta name="robots" content="noindex">`.

### 2. `src/lib/seo.ts` (extend)
- Export `DEFAULT_SEO` constant with the title/description/keywords above.
- Add `buildMeta` fallback so routes calling `buildMeta({})` get the defaults.
- Keep existing helpers (`canonicalLink`, `jsonLdScript`, etc.) untouched.

### 3. Wire defaults into `src/routes/__root.tsx`
Replace the current hard-coded `ROOT_TITLE` / `ROOT_DESC` with `DEFAULT_SEO` from `src/lib/seo.ts` and add the default `keywords` meta, so every page inherits them unless overridden.

### 4. Semantic HTML pass (light)
- Confirm each route uses one `<h1>`, with `<header>`, `<main>`, `<nav aria-label="…">`, `<article>`, `<section aria-labelledby>` — already mostly in place on `index.tsx`, `deals.tsx`, `deals.$slug.tsx`. Add `<main>` / `aria-labelledby` where missing. No visual changes.

### 5. Usage example
Update `src/routes/index.tsx` to demonstrate the component (drop-in, no behavior change) so the pattern is discoverable.

## Out of scope
- Not installing `react-helmet-async` (incompatible with TanStack Start SSR — would cause duplicate tags and hydration warnings).
- No admin UI changes — defaults live in code; per-page overrides for SEO categories already come from the DB via existing routes.

## Files
- **new**: `src/components/Seo.tsx`
- **edit**: `src/lib/seo.ts`, `src/routes/__root.tsx`, `src/routes/index.tsx`
