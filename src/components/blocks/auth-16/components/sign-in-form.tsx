"use client"

import { useState, type FormEvent } from "react"
import { IconArrowRight } from "@tabler/icons-react"

import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"

import { AUTH16_PROVIDERS, type OAuthProviderId } from "./data"

export type EmailLinkState =
  | { status: "idle" }
  | { status: "sending" }
  | { status: "sent"; email: string }
  | { status: "error"; message: string }

interface SignInFormProps {
  onProvider: (provider: OAuthProviderId) => void
  onEmail: (email: string) => void
  onResetEmail: () => void
  pendingProvider: OAuthProviderId | null
  providerError: string | null
  emailLink: EmailLinkState
}

export function SignInForm({ onProvider, onEmail, onResetEmail, pendingProvider, providerError, emailLink }: SignInFormProps) {
  const [email, setEmail] = useState("")
  const sending = emailLink.status === "sending"

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (email.trim()) onEmail(email.trim())
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-6">
      <div className="flex flex-col gap-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">
          Keep your ratings everywhere.
        </h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Sign in to save your ratings to an account and pick them up on any device.
        </p>
      </div>

      <div className="grid gap-2.5">
        {AUTH16_PROVIDERS.map((provider) => (
          <Button
            key={provider.id}
            type="button"
            variant="outline"
            disabled={pendingProvider !== null}
            onClick={() => onProvider(provider.id)}
            className="w-full justify-center px-4 [&_svg:not([class*='size-'])]:size-4"
          >
            {pendingProvider === provider.id ? <Spinner data-icon="inline-start" /> : provider.logo}
            {provider.label}
          </Button>
        ))}
        {providerError && (
          <p role="alert" className="text-destructive text-center text-sm">{providerError}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Separator className="flex-1" />
        <span className="text-muted-foreground text-xs">or</span>
        <Separator className="flex-1" />
      </div>

      {emailLink.status === "sent" ? (
        <div className="flex flex-col items-center gap-3">
          <p role="status" className="text-center text-sm leading-relaxed text-pretty">
            Check <span className="font-medium">{emailLink.email}</span> for a sign-in link. It works once and opens the table signed in.
          </p>
          <Button type="button" variant="ghost" onClick={onResetEmail}>Use a different email</Button>
        </div>
      ) : (
        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <FieldGroup>
            <Field className="gap-2" data-invalid={emailLink.status === "error" || undefined}>
              <FieldLabel htmlFor="sign-in-email">Email</FieldLabel>
              <Input
                id="sign-in-email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                disabled={sending}
                aria-invalid={emailLink.status === "error" || undefined}
                onChange={(event) => setEmail(event.target.value)}
              />
              {emailLink.status === "error" ? (
                <FieldError>{emailLink.message}</FieldError>
              ) : (
                <FieldDescription>We email you a link. No password to remember.</FieldDescription>
              )}
            </Field>
          </FieldGroup>
          <Button type="submit" variant="outline" className="w-full" disabled={sending}>
            {sending ? <Spinner data-icon="inline-start" /> : null}
            Send me a sign-in link
            {!sending && <IconArrowRight aria-hidden="true" data-icon="inline-end" />}
          </Button>
        </form>
      )}
    </div>
  )
}
