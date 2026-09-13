"use client";

import { Rating } from "@/components/reui/rating";
import type { Stars, Verdict } from "@/lib/taste";

interface RatingControlProps {
  title: string;
  verdict: Verdict | undefined;
  /** Null clears the rating; choosing the current value again does that. Half stars come from the left half of a star. */
  onChange: (verdict: Stars | null) => void;
  /** `row` fits a 36px table row; `sheet` is the larger control on the starter hand; `touch` pads each star for a fingertip on phones. */
  size?: "row" | "sheet" | "touch";
}

const SIZES = {
  row: { star: "xs", className: "h-7" },
  sheet: { star: "default", className: "h-8" },
  touch: { star: "lg", className: "h-9 -mx-1" },
} as const;

export function RatingControl({ title, verdict, onChange, size = "row" }: RatingControlProps) {
  const stars = verdict !== undefined && verdict !== "skip" ? verdict : null;
  return (
    <Rating
      editable
      step={0.5}
      rating={stars}
      size={SIZES[size].star}
      label={`Rate ${title}`}
      valueLabel={(value, max) => `${value} of ${max} stars for ${title}`}
      onRatingChange={(star) => onChange(star === stars ? null : (star as Stars))}
      className={SIZES[size].className}
    />
  );
}
