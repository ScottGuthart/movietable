"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ProviderIconProps {
  name: string;
  iconUrl: string | null;
  /** Which hover brings the mark to color: the film row it sits in, or the offer or list row it belongs to. */
  scope?: "row" | "offer";
  className?: string;
}

const HOVER: Record<NonNullable<ProviderIconProps["scope"]>, string> = {
  row: "group-hover/movie-row:opacity-100 group-hover/movie-row:grayscale-0 group-hover/movie-row:dark:invert-0",
  offer: "group-hover/offer:opacity-100 group-hover/offer:grayscale-0 group-hover/offer:dark:invert-0",
};

/** The name's first letter or digit; one glyph is all a 16px chip can hold at a legible size. */
function initial(name: string): string {
  return (name.match(/[\p{L}\p{N}]/u)?.[0] ?? "?").toUpperCase();
}

/**
 * A 16px provider mark. JustWatch's icon renders grayscale (and inverted in
 * dark mode) until its scope is hovered; a missing or failed icon falls back
 * to a one-letter outline chip so every provider still reads.
 */
export function ProviderIcon({ name, iconUrl, scope = "row", className }: ProviderIconProps) {
  const [failed, setFailed] = useState(false);
  if (!iconUrl || failed) {
    return (
      <span
        aria-hidden="true"
        className={cn("border-border text-muted-foreground inline-flex size-4 shrink-0 items-center justify-center border text-[0.625rem] leading-none font-medium", className)}
      >
        {initial(name)}
      </span>
    );
  }
  return (
    <Image
      src={iconUrl}
      alt=""
      width={16}
      height={16}
      unoptimized
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={cn("size-4 shrink-0 opacity-85 grayscale transition-[filter,opacity] duration-150 dark:invert", HOVER[scope], className)}
    />
  );
}
