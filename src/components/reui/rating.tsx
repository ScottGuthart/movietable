"use client"

import { useState, type KeyboardEvent } from "react"
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
  /** Current rating, or null when unrated. Fractions fill a star partway. */
  rating: number | null
  maxRating?: number
  /** Smallest value the visitor can choose: 1 for whole stars, 0.5 for half stars from a star's left half or the arrow keys. */
  step?: 1 | 0.5
  /** Renders each star as a button; hover and focus preview the value, click commits it. */
  editable?: boolean
  onRatingChange?: (rating: number) => void
  /** Accessible name for the group, e.g. "Rate The Godfather". */
  label: string
  /** Accessible wording for a value, used for star names and the live value line. */
  valueLabel?: (value: number, maxRating: number) => string
}

function clampStep(value: number, step: number, min: number, max: number): number {
  const snapped = Math.round(value / step) * step
  return Math.min(max, Math.max(min, snapped))
}

/**
 * Star rating in the ledger's ink: filled stars in Marquee Crimson, empty stars in Faded Ink.
 * Adapted from REUI's rating so every star is a real button with a name and a pressed state,
 * with the original's partial fill kept for half stars.
 */
function Rating({
  rating,
  maxRating = 5,
  step = 1,
  size,
  className,
  editable = false,
  onRatingChange,
  label,
  valueLabel = (value, max) => `${value} of ${max} stars`,
  ...props
}: RatingProps) {
  const [previewed, setPreviewed] = useState<number | null>(null)
  const shown = editable && previewed !== null ? previewed : (rating ?? 0)

  const valueAt = (star: number, event: { clientX: number; currentTarget: HTMLButtonElement }) => {
    if (step === 1) return star
    const { left, width } = event.currentTarget.getBoundingClientRect()
    return event.clientX - left < width / 2 ? star - 0.5 : star
  }
  const commit = (value: number) => onRatingChange?.(clampStep(value, step, step, maxRating))
  /** Arrow keys move the saved rating (or start from the focused star) by one step; a press at either end changes nothing. */
  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
    const direction = event.key === "ArrowRight" || event.key === "ArrowUp" ? 1 : event.key === "ArrowLeft" || event.key === "ArrowDown" ? -1 : 0
    if (direction === 0) return
    event.preventDefault()
    const next = clampStep((rating ?? star) + direction * step, step, step, maxRating)
    if (next === rating) return
    setPreviewed(next)
    onRatingChange?.(next)
  }

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
        const fill = Math.min(1, Math.max(0, shown - (star - 1)))
        const glyph = (
          <span className="relative flex" aria-hidden="true">
            <IconStar data-slot="rating-star-empty" className={cn(starVariants({ size }), "text-muted-foreground/60")} />
            {fill > 0 && (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <IconStarFilled data-slot="rating-star-filled" className={cn(starVariants({ size }), "text-primary")} />
              </span>
            )}
          </span>
        )
        if (!editable) return <span key={star}>{glyph}</span>
        return (
          <button
            key={star}
            type="button"
            aria-label={valueLabel(star, maxRating)}
            aria-pressed={rating !== null && Math.ceil(rating) === star}
            className="flex outline-none focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px"
            onPointerMove={(event) => setPreviewed(valueAt(star, event))}
            onPointerEnter={(event) => setPreviewed(valueAt(star, event))}
            onFocus={() => setPreviewed(star)}
            onBlur={() => setPreviewed(null)}
            onKeyDown={(event) => onKeyDown(event, star)}
            onClick={(event) => commit(valueAt(star, event))}
          >
            {glyph}
          </button>
        )
      })}
      {editable && (
        <span className="sr-only" aria-live="polite">
          {rating === null ? "Not rated" : valueLabel(rating, maxRating)}
        </span>
      )}
    </div>
  )
}

export { Rating }
