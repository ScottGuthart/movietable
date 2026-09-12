"use client"

import { useState } from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { IconStar, IconStarFilled } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

const ratingVariants = cva("inline-flex items-center", {
  variants: {
    size: {
      xs: "gap-0.5",
      sm: "gap-1",
      default: "gap-1.5",
      lg: "gap-2",
    },
  },
  defaultVariants: { size: "default" },
})

const starVariants = cva("shrink-0", {
  variants: {
    size: {
      xs: "size-4",
      sm: "size-[18px]",
      default: "size-5",
      lg: "size-6",
    },
  },
  defaultVariants: { size: "default" },
})

interface RatingProps extends Omit<React.ComponentProps<"div">, "onChange">, VariantProps<typeof ratingVariants> {
  /** Current whole-star rating, or null when unrated. */
  rating: number | null
  maxRating?: number
  /** Renders each star as a button; hover and focus preview the value, click commits it. */
  editable?: boolean
  onRatingChange?: (rating: number) => void
  /** Accessible name for the group, e.g. "Rate The Godfather". */
  label: string
  /** Accessible name for one star. */
  starLabel?: (star: number, maxRating: number) => string
}

/**
 * Whole-star rating in the ledger's ink: filled stars in Marquee Crimson, empty stars in Pencil Gray.
 * Adapted from REUI's rating so every star is a real button with a name and a pressed state.
 */
function Rating({
  rating,
  maxRating = 5,
  size,
  className,
  editable = false,
  onRatingChange,
  label,
  starLabel = (star, max) => `${star} of ${max} stars`,
  ...props
}: RatingProps) {
  const [previewed, setPreviewed] = useState<number | null>(null)
  const shown = editable && previewed !== null ? previewed : (rating ?? 0)

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="rating"
      className={cn(ratingVariants({ size }), className)}
      onMouseLeave={() => setPreviewed(null)}
      {...props}
    >
      {Array.from({ length: maxRating }, (_, index) => index + 1).map((star) => {
        const filled = shown >= star
        const Icon = filled ? IconStarFilled : IconStar
        const glyph = (
          <Icon
            aria-hidden="true"
            data-slot={filled ? "rating-star-filled" : "rating-star-empty"}
            className={cn(starVariants({ size }), filled ? "text-primary" : "text-muted-foreground/60")}
          />
        )
        if (!editable) return <span key={star}>{glyph}</span>
        return (
          <button
            key={star}
            type="button"
            aria-label={starLabel(star, maxRating)}
            aria-pressed={rating === star}
            className="flex outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
            onMouseEnter={() => setPreviewed(star)}
            onFocus={() => setPreviewed(star)}
            onBlur={() => setPreviewed(null)}
            onClick={() => onRatingChange?.(star)}
          >
            {glyph}
          </button>
        )
      })}
    </div>
  )
}

export { Rating }
