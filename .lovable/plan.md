# Refactor `src/routes/index.tsx` and `src/routes/admin.tsx`

Goal: improve readability and remove redundancy without changing any behavior, UI, queries, or data shapes.

## New shared modules

- `src/lib/types.ts` — shared types reused across pages:
  - `Department`, `Tier`, `AffiliateLink`, `Keyword`, `TierTable` (`"discount_tiers" | "price_tiers" | "review_tiers"`).
- `src/lib/admin-api.ts` — thin wrappers around Supabase calls used in admin (kept query-equivalent):
  - `fetchDepartments()`, `fetchTiers(table)`, `fetchKeywords()`, `fetchAffiliateLinks()`, `fetchFallbackUrl()`, `upsertFallbackUrl(value)`.
  - `runMutation(promise, { successMsg })` helper that toasts on error/success and returns `{ ok }`.
  - `confirmAndDelete(table, id, message)` helper.
- `src/hooks/useResource.ts` — small hook to standardise `items + load()` patterns used in every admin tab:
  - `const { items, reload } = useResource(loaderFn)` (calls loader on mount, exposes `reload`).
- `src/lib/resolve-affiliate-url.ts` — pure async function used by the home page:
  - `resolveAffiliateUrl({ deptId, discount, price, review })` returns the target URL using the same precedence: exact match → department default → global fallback. Keeps existing logic verbatim, just hoisted out of the component.

## `src/routes/index.tsx` changes

- Import shared types from `@/lib/types`.
- Replace the single `Promise.all` of 5 queries with a typed `loadHomeData()` helper kept locally; destructure into named variables.
- Extract a `useHomeData()` hook that owns: lists, default selections, `loading` state.
- Replace `handleSearch` body with a call to `resolveAffiliateUrl(...)` and a single `window.open` call. Keep error toast + `searching` state.
- Extract small presentational pieces:
  - `<TopBar />` (settings link + theme toggle).
  - `<Header />` (title + status pill).
  - `<KeywordChips items={keywords} />`.
  - `<DepartmentChips departments value onChange disabled />` — wraps the existing chip rendering; reuses the same chip class strings via a shared `chipClasses(selected)` helper from `src/lib/chip-styles.ts`.
- `ChipGroup` keeps its API; its `cn()` grid-cols ternary is replaced by a `gridColsForCount(n)` helper in the same file. Shared chip classes come from `chipClasses(selected)`.
- Remove the unused `Tier`/`Dept`/`Keyword` local type aliases (use shared types).

No JSX, classes, query shapes, ordering, fallback semantics, or copy strings change.

## `src/routes/admin.tsx` changes

- Import shared `Department`, `Tier`, `AffiliateLink`, `Keyword`, `TierTable` from `@/lib/types` (drop the local `Dept`, `Link_`, `Keyword`, etc.).
- Replace each tab's hand-rolled `load()` + `useEffect` with `useResource(...)` from the new hook.
- Replace inline `if (error) toast.error(...) else { toast.success(...); load(); }` patterns with the `runMutation` helper:
  - `const { ok } = await runMutation(supabase.from(...).update(...).eq(...), { successMsg: "Saved" }); if (ok) reload();`
- Split `AdminPage` into smaller components, all in the same file (no public API change):
  - `<AdminGuard>` — wraps the loading / unauthenticated / non-admin branches and renders `children` only when authorized. Keeps the exact same JSX/copy.
  - `<AdminHeader email />` — the top bar (`View site`, `ThemeToggle`, `Sign out`).
  - `<AdminTabs />` — the `<Tabs>` block.
- For each tab, factor repetitive table cells into tiny local components:
  - `<SortInput value onChange />` — the number input with `defaultValue` + `onBlur` numeric diff used in Departments and Keywords tabs.
  - `<UrlCellInput value onChange placeholder />` — used by Departments default URL cell.
  - `<RowActions onEdit onDelete />` — the two ghost icon buttons used in every table row.
  - `<EmptyRow colSpan label />` — the "No X yet" row.
- `LinksTab`:
  - Extract `linkFormSchema` validation into `validateLinkForm(form)` returning a string error or null.
  - Extract `<LinkFormDialog />` for the Add/Edit dialog so `LinksTab` only owns table + state.
  - Replace `tierLabel` / `deptName` lookups with two memoised maps built once per render (`new Map(...)`); same outputs.
- `KeywordsTab`: same pattern — extract `<KeywordFormDialog />`.
- `SettingsTab`: keep structure; pass loader functions from `admin-api.ts`. `TierEditor` becomes a thin wrapper that uses `runMutation` and the shared types.

## Code-quality polish (both files)

- Use `const` arrow functions everywhere (already mostly the case); replace `function` declarations only at the top-level component exports — everything else becomes `const X = (...) => ...`.
- Replace `setForm({ ...form, x: v })` with a typed `updateForm(patch)` helper inside each form-owning component.
- Use object shorthand and destructuring consistently.
- Remove dead imports left over after extractions.
- No new dependencies. No styling, copy, query, or schema changes.

## Verification

- Manual run-through of: home search (exact match / department fallback / global fallback paths), admin auth gating, CRUD on Departments / Links / Keywords / Settings tiers, fallback URL save.
- TypeScript build passes (strict mode).
