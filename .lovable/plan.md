## Goal
Restyle the home search page (`/`) to a clean, modern SaaS look using Inter + an amber palette. Light mode only — dark mode tokens stay untouched.

## Changes

### 1. `src/styles.css`
- Add Google Fonts `Inter` import (weights 400/500/600).
- Set `body { font-family: "Inter", system-ui, sans-serif; font-weight: 400; }`.
- Add a base rule for headings: `font-weight: 600; letter-spacing: -0.02em;`.
- Override **light-mode** tokens only (inside `:root`), leaving `.dark` block as-is:
  - `--background: oklch(0.985 0.005 90)` (warm off-white page) — keep `--card` pure white `oklch(1 0 0)`.
  - `--foreground: #111827`, `--muted-foreground: #6B7280`.
  - `--border: #E5E7EB`, `--input: #E5E7EB`.
  - `--primary: #F59E0B`, `--primary-foreground: #FFFFFF`, `--ring: #F59E0B`.
  - `--radius: 0.875rem` (14px) so buttons/cards/inputs inherit the new radius.
  - Replace bright `--amazon` mapping in light mode:
    - `--amazon: #F59E0B`
    - `--amazon-hover: #D97706`
    - `--amazon-foreground: #FFFFFF`
  - Add new tokens for chip selected state: `--chip-selected-bg: #FEF3C7`, `--chip-selected-border: #F59E0B`, `--chip-selected-text: #92400E`. Register in `@theme inline`.

### 2. `src/routes/index.tsx`
- Container card: `rounded-[20px]`, white bg, `shadow-[0_8px_30px_rgb(0,0,0,0.06)]`, border `border-border/60`, increase internal padding.
- Title: `font-semibold tracking-[-0.02em] text-[#111827]` (auto via token), subtitle uses `text-muted-foreground`.
- Department `SelectTrigger`: `rounded-[14px]`, `border-[#E5E7EB]`, hover border amber, focus ring amber.
- Chip buttons (`ChipGroup`):
  - Unselected: `bg-white border-[#E5E7EB] text-[#374151] hover:border-[#F59E0B] hover:shadow-sm rounded-[14px] transition-all`.
  - Selected: `bg-[--chip-selected-bg] border-[--chip-selected-border] text-[--chip-selected-text] shadow-sm`.
  - Check circle: amber when selected (`bg-[#F59E0B] text-white`).
  - Gap tightened to `gap-3`, min-height kept; consistent 12–16px spacing.
- Search button: `rounded-[14px] font-medium bg-[#F59E0B] hover:bg-[#D97706] active:bg-[#B45309] text-white shadow-sm transition-colors`. Replace existing `bg-amazon` classes.
- Section labels: `text-sm font-medium text-[#374151]` (slightly stronger than muted) with consistent `space-y-3`.
- Outer wrapper spacing: `py-12 sm:py-16`, max width `max-w-xl` for a tighter, premium feel.

### 3. `ThemeToggle` / admin button area
- No structural changes; they pick up new radius/border tokens automatically.

## Out of scope
- Dark mode palette (intentionally untouched).
- Admin and login pages (only home page in this request — can extend later if desired).
- Adding new functionality.

## Verification
- Visual check at 981px and a mobile width (375px) in light mode.
- Confirm dark mode still renders with previous palette.
