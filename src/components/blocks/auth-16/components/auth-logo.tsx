import Link from "next/link"
import { IconMovie } from "@tabler/icons-react"

import { cn } from "@/lib/utils"

export function AuthLogo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("inline-flex items-center gap-2 underline-offset-4 hover:underline", className)}>
      <IconMovie className="text-primary size-5" aria-hidden="true" />
      <span className="text-base font-semibold tracking-tight">
        MovieTable<span className="text-primary">.</span>
      </span>
    </Link>
  )
}
