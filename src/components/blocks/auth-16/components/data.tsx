import type { ReactNode } from "react"

import { GithubLight } from "@/components/ui/svgs/githubLight"
import { Google } from "@/components/ui/svgs/google"

export type OAuthProviderId = "google" | "github"

export type AuthProvider = {
  id: OAuthProviderId
  label: string
  logo: ReactNode
}

export const AUTH16_PROVIDERS: AuthProvider[] = [
  {
    id: "google",
    label: "Continue with Google",
    logo: <Google aria-hidden="true" data-icon="inline-start" />,
  },
  {
    id: "github",
    label: "Continue with GitHub",
    logo: <GithubLight aria-hidden="true" data-icon="inline-start" />,
  },
]
