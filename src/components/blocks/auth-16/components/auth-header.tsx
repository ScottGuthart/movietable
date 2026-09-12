import Link from "next/link"
import { IconArrowLeft } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"

import { AuthLogo } from "./auth-logo"

export function AuthHeader() {
  return (
    <header className="flex items-center justify-between gap-4 px-6 py-5 sm:px-8 sm:py-6 lg:px-10">
      <AuthLogo />
      <Button variant="ghost" nativeButton={false} render={<Link href="/" />}>
        <IconArrowLeft data-icon="inline-start" aria-hidden="true" />
        Back to the table
      </Button>
    </header>
  )
}
