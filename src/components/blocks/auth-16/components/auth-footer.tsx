import Link from "next/link"

export function AuthFooter() {
  return (
    <footer className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 py-10 text-center sm:px-8 sm:py-12">
      <p className="text-muted-foreground max-w-md text-xs leading-5 text-pretty sm:text-sm">
        Signing in keeps your ratings together with the name, email address, and picture your provider shares. The table stays open to everyone.
      </p>
      <nav className="flex items-baseline gap-4 text-xs" aria-label="About MovieTable">
        <Link href="/privacy" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Privacy policy</Link>
        <Link href="/support" className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">Support</Link>
      </nav>
    </footer>
  )
}
