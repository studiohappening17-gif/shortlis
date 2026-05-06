import { cn } from "./utils";

export const chipBase =
  "rounded-[14px] border px-4 py-3 text-sm font-medium transition-all";

export const chipClasses = (selected: boolean) =>
  cn(
    chipBase,
    selected
      ? "border-chip-selected-border bg-chip-selected-bg text-chip-selected-text shadow-sm"
      : "border-border bg-card text-foreground/75 hover:border-amazon hover:shadow-sm",
  );

export const gridColsForCount = (n: number) =>
  n <= 2
    ? "grid-cols-2"
    : n === 4
      ? "grid-cols-2 sm:grid-cols-4"
      : n === 3
        ? "grid-cols-3"
        : "grid-cols-3 sm:grid-cols-5";
