import type { Metadata } from "next";
import { Page as SignIn } from "@/components/blocks/auth-16/page";
import { isV0Preview } from "@/lib/preview-mode";

export const metadata: Metadata = {
  title: isV0Preview() ? "Local preview — MovieTable" : "Sign in — MovieTable",
  description: isV0Preview()
    ? "Explore sample movies with browser-only ratings in v0 preview. Accounts and cloud sync are disabled."
    : "Sign in with Google, GitHub, or an emailed link to keep your MovieTable ratings on every device.",
};

export default function SignInPage() {
  return <SignIn />;
}
