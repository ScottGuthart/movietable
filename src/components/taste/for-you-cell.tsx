"use client";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { MatchReason } from "@/lib/taste";

interface ForYouCellProps {
  value: number | null;
  /** Computed only when the explanation opens. */
  explain: () => MatchReason[];
  /** Why the value is missing, when it is. */
  unavailable?: string;
}

function Reasons({ explain }: { explain: () => MatchReason[] }) {
  const reasons = explain();
  if (reasons.length === 0) return <>No shared attributes yet. Ranked by Final Score.</>;
  return <>Because you liked: {reasons.map((reason) => reason.label).join(" · ")}</>;
}

/** The visitor's number as a crimson chip; hover, tap, or Enter opens why it matched. */
export function ForYouCell({ value, explain, unavailable }: ForYouCellProps) {
  if (value === null) {
    return (
      <span aria-label={unavailable ?? "Unavailable"} title={unavailable} className="text-muted-foreground">—</span>
    );
  }
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        delay={150}
        aria-label={`For you ${value}. Show why`}
        className="bg-primary/10 text-primary inline-flex min-w-10 justify-center px-2 py-1 font-semibold tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
      >
        {value}
      </PopoverTrigger>
      <PopoverContent side="left" className="w-auto max-w-64 px-3 py-2 text-xs leading-relaxed text-pretty">
        <Reasons explain={explain} />
      </PopoverContent>
    </Popover>
  );
}
