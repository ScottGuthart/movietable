"use client";

import type { ReactNode } from "react";
import { IconArrowsShuffle } from "@tabler/icons-react";
import { HandCarousel, type HandCarouselCell } from "@/components/taste/hand-carousel";
import { HandCell, HandCellSkeleton } from "@/components/taste/hand-cell";
import type { Taste } from "@/components/taste/use-taste";
import { Button } from "@/components/ui/button";
import { HAND_SIZE, SHARP_PROFILE_SIZE } from "@/lib/taste";
import { useMediaQuery } from "@/lib/use-media-query";

type TastePanelProps = Pick<Taste, "state" | "retry" | "hand" | "handTotal" | "verdicts" | "rate" | "dealAnother" | "rated" | "positive">;

function guidance({ rated, positive }: Pick<TastePanelProps, "rated" | "positive">): string {
  if (rated === 0) return "Rate films you've seen, half a star to five. Your list re-ranks as you go.";
  if (!positive) return "Ratings under four stars can't build a ranking on their own. Give one film four or five.";
  if (rated < SHARP_PROFILE_SIZE) return "Rate a few more for a sharper match.";
  return "Keep going here, or rate straight from the table.";
}

/** The hand as one ruled sheet: Paper cells divided by hairlines, two across from 640px and four from 1024px. */
function Sheet({ cells }: { cells: HandCarouselCell[] }) {
  return (
    <ul className="bg-border border-border grid grid-cols-2 gap-px border lg:grid-cols-4" aria-label="Films to rate">
      {cells.map((cell) => <li key={cell.key} className="flex">{cell.node}</li>)}
    </ul>
  );
}

function handCells({ state, hand, verdicts, rate, phone }: Pick<TastePanelProps, "state" | "hand" | "verdicts" | "rate"> & { phone: boolean }): HandCarouselCell[] {
  if (state.status !== "ready") {
    return Array.from({ length: HAND_SIZE }, (_, index) => ({ key: `skeleton-${index}`, node: <HandCellSkeleton /> }));
  }
  return hand.map((film) => ({
    key: film.slug,
    node: <HandCell film={film} verdict={verdicts[film.slug]} onRate={rate} size={phone ? "touch" : "sheet"} />,
  }));
}

function PanelBody(props: Pick<TastePanelProps, "state" | "retry" | "hand" | "verdicts" | "rate">): ReactNode {
  const { state, retry, hand } = props;
  const phone = useMediaQuery("(max-width: 639px)");
  if (state.status === "error") {
    return (
      <div className="flex flex-wrap items-center gap-3" role="alert">
        <p className="text-sm">{state.message}</p>
        <Button type="button" variant="outline" onClick={retry}>Try again</Button>
      </div>
    );
  }
  if (state.status === "ready" && hand.length === 0) {
    return <p className="text-muted-foreground text-sm">You’ve judged every film we can deal. Rate more straight from the table.</p>;
  }
  const cells = handCells({ ...props, phone });
  return phone ? <HandCarousel cells={cells} /> : <Sheet cells={cells} />;
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
