"use client";

import Link from "next/link";
import { IconChevronDown } from "@tabler/icons-react";
import { useState } from "react";
import { useRatingsSync, type SyncState } from "@/components/auth/use-ratings-sync";
import { signOut } from "@/components/auth/sign-out";
import { useSession } from "@/components/auth/use-session";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { isSupabaseConfigured } from "@/lib/supabase-browser";

function syncLabel(sync: SyncState): string {
  switch (sync.status) {
    case "syncing": return "Syncing your ratings…";
    case "synced": return "Ratings saved to your account.";
    case "error": return sync.message;
    case "idle": return "";
  }
}

/** Header control: a quiet sign-in link for guests, an account menu with sync status for the signed in. */
export function Account() {
  if (!isSupabaseConfigured()) return null;
  return <AccountControl />;
}

function AccountControl() {
  const session = useSession();
  const sync = useRatingsSync(session.status === "signed-in" ? session.session : null);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const handleSignOut = () => {
    signOut().catch((error: unknown) => setSignOutError(error instanceof Error ? error.message : "Sign-out failed."));
  };

  if (session.status === "loading") return <span className="inline-block h-8" aria-hidden="true" />;
  if (session.status === "signed-out") {
    return <Button variant="ghost" className="-ml-2.5 sm:-mr-2.5 sm:ml-0" nativeButton={false} render={<Link href="/sign-in" />}>Sign in</Button>;
  }

  const { user } = session.session;
  const name = typeof user.user_metadata.full_name === "string" ? user.user_metadata.full_name : (user.email ?? "Account");
  const avatarUrl = typeof user.user_metadata.avatar_url === "string" ? user.user_metadata.avatar_url : undefined;
  const initial = name.trim().charAt(0).toUpperCase() || "?";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="-ml-2.5 sm:-mr-2.5 sm:ml-0" aria-label={`Account, ${name}`} />}>
        <Avatar className="size-5">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-[0.625rem]">{initial}</AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate">{name}</span>
        <IconChevronDown data-icon="inline-end" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5">
          <span className="truncate font-medium">{user.email}</span>
          <span className={signOutError ? "text-destructive text-xs font-normal" : "text-muted-foreground text-xs font-normal"} role="status">{signOutError ?? syncLabel(sync)}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
