"use client";

import { IconThumbDown, IconThumbDownFilled, IconThumbUp, IconThumbUpFilled } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import type { Verdict } from "@/lib/taste";
import { cn } from "@/lib/utils";

interface RatingControlProps {
  title: string;
  verdict: Verdict | undefined;
  onChange: (verdict: Verdict | null) => void;
  /** `row` fits a 36px table row; `sheet` is the 32px control used on the starter hand. */
  size?: "row" | "sheet";
}

export function RatingControl({ title, verdict, onChange, size = "row" }: RatingControlProps) {
  const toggle = (next: Verdict) => onChange(verdict === next ? null : next);
  const buttonSize = size === "row" ? "icon-sm" : "icon";
  const liked = verdict === "like";
  const passed = verdict === "pass";
  return (
    <span role="group" aria-label={`Rate ${title}`} className="inline-flex items-center gap-0.5">
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        aria-pressed={liked}
        aria-label={liked ? `Liked ${title}` : `Like ${title}`}
        onClick={() => toggle("like")}
        className={cn(liked ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-foreground")}
      >
        {liked ? <IconThumbUpFilled aria-hidden="true" /> : <IconThumbUp aria-hidden="true" />}
      </Button>
      <Button
        type="button"
        variant="ghost"
        size={buttonSize}
        aria-pressed={passed}
        aria-label={passed ? `Not for me: ${title}` : `Not for me: ${title}`}
        onClick={() => toggle("pass")}
        className={cn(passed ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        {passed ? <IconThumbDownFilled aria-hidden="true" /> : <IconThumbDown aria-hidden="true" />}
      </Button>
    </span>
  );
}
