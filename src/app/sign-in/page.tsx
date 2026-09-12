import type { Metadata } from "next";
import { Page as SignIn } from "@/components/blocks/auth-16/page";

export const metadata: Metadata = {
  title: "Sign in — MovieTable",
  description: "Sign in with Google, GitHub, or an emailed link to keep your MovieTable ratings on every device.",
};

export default function SignInPage() {
  return <SignIn />;
}
