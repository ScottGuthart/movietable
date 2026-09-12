"use client";

import Link from "next/link";
import { useState } from "react";
import { IconLogout, IconSelector, IconTrash } from "@tabler/icons-react";
import type { Session } from "@supabase/supabase-js";
import { signOut } from "@/components/auth/sign-out";
import { useRatingsSync, type SyncState } from "@/components/auth/use-ratings-sync";
import { useSession } from "@/components/auth/use-session";
import { clearVerdicts, useTasteVerdicts } from "@/components/taste/taste-store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase-browser";
import { ratedCount } from "@/lib/taste";

function syncLabel(sync: SyncState): string {
  switch (sync.status) {
    case "syncing": return "Syncing your ratings…";
    case "synced": return "Ratings saved to your account.";
    case "error": return sync.message;
    case "idle": return "";
  }
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const letters = parts.slice(0, 2).map((part) => part.charAt(0).toUpperCase()).join("");
  return letters || "?";
}

function profileOf(session: Session): { name: string; email: string | undefined; avatarUrl: string | undefined } {
  const { user } = session;
  const fullName = user.user_metadata.full_name;
  const avatar = user.user_metadata.avatar_url;
  return {
    name: typeof fullName === "string" && fullName.trim() ? fullName : (user.email ?? "Account"),
    email: user.email,
    avatarUrl: typeof avatar === "string" ? avatar : undefined,
  };
}

async function deleteSavedRatings(userId: string): Promise<void> {
  const { error } = await getSupabase().from("taste_ratings").delete().eq("user_id", userId);
  if (error) throw new Error(`Deleting your saved ratings failed: ${error.message}`);
  clearVerdicts();
}

/** Header control: a quiet sign-in link for guests, a compact avatar menu for the signed in. */
export function Account() {
  if (!isSupabaseConfigured()) return null;
  return <AccountControl />;
}

function AccountControl() {
  const session = useSession();
  if (session.status === "loading") return <span className="inline-block h-8" aria-hidden="true" />;
  if (session.status === "signed-out") {
    return <Button variant="ghost" className="-ml-2.5 sm:-mr-2.5 sm:ml-0" nativeButton={false} render={<Link href="/sign-in" />}>Sign in</Button>;
  }
  return <AccountMenu session={session.session} />;
}

function AccountMenu({ session }: { session: Session }) {
  const sync = useRatingsSync(session);
  const verdicts = useTasteVerdicts();
  const [notice, setNotice] = useState<{ tone: "info" | "error"; text: string } | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const { name, email, avatarUrl } = profileOf(session);
  const rated = ratedCount(verdicts);

  const report = (error: unknown, fallback: string) =>
    setNotice({ tone: "error", text: error instanceof Error ? error.message : fallback });
  const handleSignOut = () => signOut().catch((error: unknown) => report(error, "Sign-out failed."));
  const handleDelete = () => {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setConfirmingDelete(false);
    deleteSavedRatings(session.user.id)
      .then(() => setNotice({ tone: "info", text: "Saved ratings deleted." }))
      .catch((error: unknown) => report(error, "Deleting your saved ratings failed."));
  };
  const status = notice ?? { tone: "info" as const, text: syncLabel(sync) };

  return (
    <DropdownMenu onOpenChange={(open) => { if (!open) setConfirmingDelete(false); }}>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-8 gap-1.5 rounded-full pr-2.5 pl-1" aria-label={`Account, ${name}`} />}
      >
        <Avatar className="border-background size-6 border">
          {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
          <AvatarFallback className="text-[0.625rem]">{initialsOf(name)}</AvatarFallback>
        </Avatar>
        <span className="max-w-40 truncate text-xs font-medium">{name}</span>
        <IconSelector className="size-3.5 opacity-60" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="end" sideOffset={8}>
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex flex-col gap-0.5">
            <span className="truncate font-medium">{name}</span>
            {email && email !== name && <span className="text-muted-foreground truncate text-xs font-normal">{email}</span>}
            <span role="status" className={status.tone === "error" ? "text-destructive text-xs font-normal" : "text-muted-foreground text-xs font-normal"}>
              {status.text}
            </span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem closeOnClick={false} disabled={rated === 0 && !confirmingDelete} onClick={handleDelete}>
            <IconTrash aria-hidden="true" />
            <span>{confirmingDelete ? `Delete ${rated} saved ${rated === 1 ? "rating" : "ratings"}? Click again` : "Delete saved ratings"}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <IconLogout aria-hidden="true" />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
