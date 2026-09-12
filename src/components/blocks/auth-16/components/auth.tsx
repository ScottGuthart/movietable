"use client"

import { useState } from "react"
import Link from "next/link"

import { signOut } from "@/components/auth/sign-out"
import { useSession } from "@/components/auth/use-session"
import { Button } from "@/components/ui/button"
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase-browser"

import { AuthFooter } from "./auth-footer"
import { AuthHeader } from "./auth-header"
import type { OAuthProviderId } from "./data"
import { SignInForm, type EmailLinkState } from "./sign-in-form"

function returnUrl(): string {
  return `${window.location.origin}/`
}

function SignedIn({ email }: { email: string | undefined }) {
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const handleSignOut = () => {
    signOut().catch((error: unknown) => setSignOutError(error instanceof Error ? error.message : "Sign-out failed."))
  }
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6 text-center">
      <div className="flex flex-col gap-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">You&rsquo;re signed in.</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          {email ? <>Ratings on this device save to <span className="text-foreground font-medium">{email}</span>.</> : "Your ratings save to your account."}
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button nativeButton={false} render={<Link href="/" />}>Back to the table</Button>
        <Button variant="outline" onClick={handleSignOut}>Sign out</Button>
      </div>
      {signOutError && <p role="alert" className="text-destructive text-sm">{signOutError}</p>}
    </div>
  )
}

function NotConfigured() {
  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
      <h1 className="text-2xl font-semibold tracking-tight text-balance">Sign-in isn&rsquo;t available here.</h1>
      <p className="text-muted-foreground text-sm text-pretty">This deployment has no account service configured. Your ratings still save in this browser.</p>
      <Button variant="outline" nativeButton={false} render={<Link href="/" />}>Back to the table</Button>
    </div>
  )
}

export function Auth() {
  return (
    <div className="flex min-h-svh w-full flex-col">
      <AuthHeader />
      <main className="flex flex-1 items-center justify-center px-6 py-10 sm:px-8 sm:py-12">
        {isSupabaseConfigured() ? <AuthBody /> : <NotConfigured />}
      </main>
      <AuthFooter />
    </div>
  )
}

function AuthBody() {
  const session = useSession()
  const [pendingProvider, setPendingProvider] = useState<OAuthProviderId | null>(null)
  const [providerError, setProviderError] = useState<string | null>(null)
  const [emailLink, setEmailLink] = useState<EmailLinkState>({ status: "idle" })

  async function signInWith(provider: OAuthProviderId) {
    setPendingProvider(provider)
    setProviderError(null)
    const { error } = await getSupabase().auth.signInWithOAuth({ provider, options: { redirectTo: returnUrl() } })
    if (error) {
      setPendingProvider(null)
      setProviderError(`Sign-in with ${provider === "google" ? "Google" : "GitHub"} failed: ${error.message}`)
    }
  }

  async function sendLink(email: string) {
    setEmailLink({ status: "sending" })
    const { error } = await getSupabase().auth.signInWithOtp({ email, options: { emailRedirectTo: returnUrl() } })
    setEmailLink(error ? { status: "error", message: `Sending the link failed: ${error.message}` } : { status: "sent", email })
  }

  if (session.status === "signed-in") return <SignedIn email={session.session.user.email} />
  return (
    <SignInForm
      onProvider={(provider) => void signInWith(provider)}
      onEmail={(email) => void sendLink(email)}
      onResetEmail={() => setEmailLink({ status: "idle" })}
      pendingProvider={pendingProvider}
      providerError={providerError}
      emailLink={emailLink}
    />
  )
}
