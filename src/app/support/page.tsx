import type { Metadata } from "next";
import Link from "next/link";
import { ReadPage } from "@/components/read/read-page";

export const metadata: Metadata = {
  title: "Support — MovieTable",
  description: "Help with signing in, syncing ratings, and deleting your MovieTable account.",
};

export default function SupportPage() {
  return (
    <ReadPage title="Support" updated="September 16, 2026">
      <section>
        <p>
          MovieTable is a ranked ledger of films: compare audience and critic scores, rate a few films, and let your
          own taste reorder the table. The table is open to everyone; an account only keeps your ratings in sync.
        </p>
      </section>

      <section>
        <h2>Signing in</h2>
        <p>
          Sign in with Google, GitHub, or an emailed link from the <Link href="/sign-in">sign-in page</Link>. Email
          links expire and must be opened in the same browser that requested them — if the link fails, request a fresh
          one. If sign-in is unavailable, the table still works and your ratings stay in the browser.
        </p>
      </section>

      <section>
        <h2>Syncing ratings</h2>
        <p>
          The account menu shows the sync state under your name. &ldquo;Ratings saved to your account&rdquo; means the
          server copy is current. If sync fails, your ratings are not lost — they remain on the device and upload on
          the next successful sync.
        </p>
      </section>

      <section>
        <h2>Managing your data</h2>
        <ul>
          <li><strong>Clear ratings</strong> removes every rating from your account and this device but keeps the account.</li>
          <li><strong>Delete account</strong> permanently deletes the account and all ratings saved to it, on the server and on the device. Both live in the account menu; both ask first.</li>
        </ul>
      </section>

      <section>
        <h2>About the scores</h2>
        <p>
          MovieTable is a curated dataset, not live ratings. Scores can differ from what Metacritic shows today;
          select any film to see its current scores on Metacritic.
        </p>
      </section>

      <section>
        <h2>Reporting a problem</h2>
        <p>
          The best way to reach us is an issue on the{" "}
          <a href="https://github.com/ScottGuthart/movietable/issues" target="_blank" rel="noopener noreferrer">MovieTable repository</a>{" "}
          — bugs, wrong scores, film requests, and privacy questions all land there. How your data is handled is
          described in the <Link href="/privacy">privacy policy</Link>.
        </p>
      </section>
    </ReadPage>
  );
}
