"use client";

import type { ReactNode } from "react";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, useCarousel, useEmblaValue } from "@/components/ui/carousel";

export interface HandCarouselCell {
  key: string;
  node: ReactNode;
}

/** Previous, "3 of 12", Next; the count follows the carousel so it never disagrees with the slide in view. */
function Controls({ count }: { count: number }) {
  const { api, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCarousel();
  const current = useEmblaValue(api, (embla) => embla.selectedScrollSnap() + 1, 1);

  return (
    <div className="flex items-center justify-between pt-3">
      <Button type="button" variant="outline" size="icon-lg" aria-label="Previous film" disabled={!canScrollPrev} onClick={scrollPrev}>
        <IconChevronLeft aria-hidden="true" />
      </Button>
      <p className="text-muted-foreground text-sm tabular-nums" aria-live="polite">
        {current} of {count}
      </p>
      <Button type="button" variant="outline" size="icon-lg" aria-label="Next film" disabled={!canScrollNext} onClick={scrollNext}>
        <IconChevronRight aria-hidden="true" />
      </Button>
    </div>
  );
}

/**
 * The starter hand on a phone: one film at a time with the next peeking at the edge, so the title
 * and its stars are always in view together. Cells keep the sheet's hairline divisions.
 */
export function HandCarousel({ cells }: { cells: HandCarouselCell[] }) {
  return (
    <Carousel opts={{ align: "start", containScroll: "trimSnaps" }} aria-label="Films to rate">
      <div className="bg-border border">
        <CarouselContent className="-ml-px">
          {cells.map((cell) => (
            <CarouselItem key={cell.key} className="flex basis-[88%] pl-px">
              {cell.node}
            </CarouselItem>
          ))}
        </CarouselContent>
      </div>
      <Controls count={cells.length} />
    </Carousel>
  );
}
