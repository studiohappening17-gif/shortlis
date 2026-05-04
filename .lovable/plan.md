## Goal
Swap the light-mode green accent palette for a soft, light purplish palette. Layout, dark mode, and structure unchanged.

## Changes — `src/styles.css` (`:root` block only)

Replace these tokens (hue 155 → 295, slightly lighter):

- `--primary: oklch(0.65 0.13 295)`
- `--ring: oklch(0.65 0.13 295)`
- `--amazon: oklch(0.65 0.13 295)` (CTA / search button)
- `--amazon-hover: oklch(0.58 0.14 295)`
- `--amazon-foreground: oklch(1 0 0)` (unchanged)
- `--chip-selected-bg: oklch(0.96 0.04 295)` (soft lavender tint)
- `--chip-selected-border: oklch(0.65 0.13 295)`
- `--chip-selected-text: oklch(0.38 0.12 295)` (deep plum for contrast)

These cascade automatically to: primary buttons, the Search CTA, focus rings, selected chip background/border/text, and hover borders on chips and the department select.

## Out of scope
- Dark mode palette
- Page layout, spacing, copy, components
