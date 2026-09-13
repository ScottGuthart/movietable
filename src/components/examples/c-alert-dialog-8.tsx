import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { IconAlertCircle } from "@tabler/icons-react";

export function Pattern() {
  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={<Button variant="destructive">Deactivate Account</Button>}
      />
      <AlertDialogContent>
        <div className="flex items-start gap-3 py-1">
          <div className="bg-destructive/10 dark:bg-destructive/10 rounded-full flex size-10 shrink-0 items-center justify-center">
            <IconAlertCircle className="text-destructive size-5" />
          </div>
          <div className="flex flex-col justify-center gap-1">
            <AlertDialogTitle className="text-sm font-semibold">
              Deactivate your account?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-sm">
              This will disable your account and remove your profile from all
              active searches.
            </AlertDialogDescription>
          </div>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep My Account</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Deactivate Anyway
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
