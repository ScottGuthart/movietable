import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export function PreviewNotice() {
  return (
    <Alert role="note" aria-label="v0 preview">
      <AlertTitle>v0 preview · Sample data</AlertTitle>
      <AlertDescription>
        Movies, scores, awards, and availability are illustrative. Ratings save in this browser only; sign-in and cloud sync are disabled.
      </AlertDescription>
    </Alert>
  );
}
