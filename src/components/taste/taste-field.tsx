"use client";

import { IconChevronDown } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import type { CatalogueState } from "@/components/taste/use-taste-catalogue";
import { cn } from "@/lib/utils";

interface TasteFieldProps {
  open: boolean;
  onToggle: () => void;
  rated: number;
  positive: boolean;
  active: boolean;
  summary: string[];
  persistent: boolean;
  state: CatalogueState;
}

function filmsWord(count: number): string {
  return `${count} ${count === 1 ? "film" : "films"}`;
}

function helperText({ rated, positive, active, summary, persistent, state }: Omit<TasteFieldProps, "open" | "onToggle">): string {
  if (!persistent) return "Ratings won't save in this browser.";
  if (state.status === "error") return "Film details didn't load. Open the panel to retry.";
  if (active) return summary.length > 0 ? `Built from ${filmsWord(rated)} · ${summary.join(" · ")}` : `Built from ${filmsWord(rated)}`;
  if (rated > 0 && !positive) return "Give a film four or five stars to build your ranking.";
  if (rated > 0 && state.status === "loading") return "Loading film details…";
  return "Rate films you've seen, half a star to five.";
}

export function TasteField(props: TasteFieldProps) {
  const { open, onToggle, rated } = props;
  return (
    <Field className="md:max-w-sm">
      <div className="flex items-center justify-between gap-3">
        <FieldLabel htmlFor="taste-toggle">Your taste</FieldLabel>
        <output className="text-muted-foreground text-sm" data-testid="taste-status">
          {rated === 0 ? "Not set" : `${filmsWord(rated)} rated`}
        </output>
      </div>
      <div className="flex items-center gap-2">
        <Button id="taste-toggle" type="button" variant="outline" aria-expanded={open} aria-controls="taste-panel" onClick={onToggle}>
          {rated === 0 ? "Rate films" : "Edit ratings"}
          <IconChevronDown data-icon="inline-end" aria-hidden="true" className={cn("transition-transform duration-150", open && "rotate-180")} />
        </Button>
      </div>
      <p className="text-muted-foreground text-sm" data-testid="taste-summary">{helperText(props)}</p>
    </Field>
  );
}
