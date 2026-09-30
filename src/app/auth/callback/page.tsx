import Link from "next/link";

export const metadata = { title: "Signing in · MovieTable" };

export default function AuthCallbackPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-medium">Signed in on the web</p>
      <p className="text-sm text-neutral-600">
        If the app didn&apos;t open, open MovieTable and tap Sign in — or install it from the App Store.
      </p>
      <Link href="/" className="rounded border border-neutral-300 px-4 py-2 text-sm">
        Go to the table
      </Link>
    </main>
  );
}
