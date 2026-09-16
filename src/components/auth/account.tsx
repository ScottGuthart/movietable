"use client";

import Link from "next/link";
import { useState } from "react";
import { IconLogout, IconSelector, IconTrash } from "@tabler/icons-react";
import type { Session } from "@supabase/supabase-js";
import { deleteAccount } from "@/components/auth/delete-account";
import { signOut } from "@/components/auth/sign-out";
import { useRatingsSync, type SyncState } from "@/components/auth/use-ratings-sync";
import { useSession } from "@/components/auth/use-session";
import { clearVerdicts, useTasteVerdicts } from "@/components/taste/taste-store";
import { AppearanceMenuGroup } from "@/components/theme/appearance-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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

/** Removes the account's saved ratings, then this browser's, so a retry after a failure still has the local copy. */
async function clearRatings(userId: string): Promise<void> {
  const { error } = await getSupabase().from("taste_ratings").delete().eq("user_id", userId);
  if (error) throw new Error(`Clearing your ratings failed: ${error.message}`);
  clearVerdicts();
}

function ratingsWord(count: number): string {
  return `${count} ${count === 1 ? "rating" : "ratings"}`;
}

/** The only way to clear ratings: confirmed here, it empties the account and this browser and resets the taste ranking. */
function ClearRatingsDialog({ open, onOpenChange, rated, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; rated: number; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <IconTrash aria-hidden="true" className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Clear your ratings?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the {ratingsWord(rated)} saved to your account and in this browser and resets your taste ranking. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep ratings</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>Clear ratings</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/** Deletes the account itself: the confirmed path removes the account, its saved ratings, and this browser's session. */
function DeleteAccountDialog({ open, onOpenChange, deleting, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; deleting: boolean; onConfirm: () => void }) {
  return (
    <AlertDialog open={open} onOpenChange={(next) => { if (!deleting) onOpenChange(next); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10">
            <IconTrash aria-hidden="true" className="text-destructive" />
          </AlertDialogMedia>
          <AlertDialogTitle>Delete your account?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes your account, the ratings saved to it, and the ratings in this browser. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Keep account</AlertDialogCancel>
          <AlertDialogAction variant="destructive" disabled={deleting} onClick={onConfirm}>
            {deleting ? "Deleting…" : "Delete account"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
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
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { name, email, avatarUrl } = profileOf(session);
  const rated = ratedCount(verdicts);

  const report = (error: unknown, fallback: string) =>
    setNotice({ tone: "error", text: error instanceof Error ? error.message : fallback });
  const handleSignOut = () => signOut().catch((error: unknown) => report(error, "Sign-out failed."));
  const handleClear = () => {
    clearRatings(session.user.id)
      .then(() => setNotice({ tone: "info", text: "Ratings cleared." }))
      .catch((error: unknown) => report(error, "Clearing your ratings failed."));
  };
  const handleDelete = () => {
    setDeleting(true);
    // A success signs this browser out, unmounting the menu; only a failure needs a notice.
    deleteAccount()
      .catch((error: unknown) => {
        setDeleting(false);
        setDeleteOpen(false);
        report(error, "Deleting your account failed.");
      });
  };
  const status = notice ?? { tone: "info" as const, text: syncLabel(sync) };

  return (
    <>
      <DropdownMenu>
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
            <DropdownMenuItem disabled={rated === 0} onClick={() => setConfirmOpen(true)}>
              <IconTrash aria-hidden="true" />
              <span>Clear ratings</span>
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => setDeleteOpen(true)}>
              <IconTrash aria-hidden="true" />
              <span>Delete account</span>
            </DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <AppearanceMenuGroup />
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            <IconLogout aria-hidden="true" />
            <span>Sign out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ClearRatingsDialog open={confirmOpen} onOpenChange={setConfirmOpen} rated={rated} onConfirm={handleClear} />
      <DeleteAccountDialog open={deleteOpen} onOpenChange={setDeleteOpen} deleting={deleting} onConfirm={handleDelete} />
    </>
  );
}
