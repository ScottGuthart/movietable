"use client";

import { IconArrowsShuffle } from "@tabler/icons-react";
import { HandCell, HandCellSkeleton } from "@/components/taste/hand-cell";
import type { Taste } from "@/components/taste/use-taste";
import { Button } from "@/components/ui/button";
import { HAND_SIZE, SHARP_PROFILE_SIZE } from "@/lib/taste";

type TastePanelProps = Pick<Taste, "state" | "retry" | "hand" | "handTotal" | "verdicts" | "rate" | "dealAnother" | "rated" | "positive">;

function guidance({ rated, positive }: Pick<TastePanelProps, "rated" | "positive">): string {
  if (rated === 0) return "Rate films you've seen, one to five stars. Your list re-ranks as you go.";
  if (!positive) return "Ratings under four stars can't build a ranking on their own. Give one film four or five.";
  if (rated < SHARP_PROFILE_SIZE) return "Rate a few more for a sharper match.";
  return "Keep going here, or rate straight from the table.";
}

function Sheet({ children }: { children: React.ReactNode }) {
  return (
    <ul
      className="bg-border border-border flex snap-x snap-mandatory gap-px overflow-x-auto border [scrollbar-color:var(--border)_transparent] [scrollbar-width:thin] sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4"
      aria-label="Films to rate"
    >
      {children}
    </ul>
  );
}

function PanelBody({ state, retry, hand, verdicts, rate }: Pick<TastePanelProps, "state" | "retry" | "hand" | "verdicts" | "rate">) {
  if (state.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3" role="alert">
        <p className="text-sm">{state.message}</p>
        <Button type="button" variant="outline" onClick={retry}>Try again</Button>
      </div>
    );
  }
  if (state.status !== "ready") {
    return (
      <Sheet>
        {Array.from({ length: HAND_SIZE }, (_, index) => <HandCellSkeleton key={index} />)}
      </Sheet>
    );
  }
  if (hand.length === 0) {
    return <p className="text-muted-foreground text-sm">You’ve judged every film we can deal. Rate more straight from the table.</p>;
  }
  return (
    <>
      <Sheet>
        {hand.map((film) => <HandCell key={film.slug} film={film} verdict={verdicts[film.slug]} onRate={rate} />)}
      </Sheet>
      <p className="text-muted-foreground pt-2 text-xs sm:hidden">Swipe sideways for all {hand.length} films.</p>
    </>
  );
}

export function TastePanel(props: TastePanelProps) {
  const { handTotal, dealAnother, state } = props;
  return (
    <section id="taste-panel" aria-labelledby="taste-heading" className="bg-muted/40 text-foreground border-t">
      <div className="flex flex-wrap items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <div>
          <h3 id="taste-heading" className="font-medium">Tune to your taste</h3>
          <p className="text-muted-foreground pt-1 text-sm leading-relaxed">{guidance(props)}</p>
        </div>
        <Button type="button" variant="outline" onClick={dealAnother} disabled={state.status !== "ready" || handTotal <= HAND_SIZE}>
          <IconArrowsShuffle data-icon="inline-start" aria-hidden="true" />
          Deal another hand
        </Button>
      </div>
      <div className="px-5 pt-4 pb-5 sm:px-6">
        <PanelBody {...props} />
      </div>
    </section>
  );
}
