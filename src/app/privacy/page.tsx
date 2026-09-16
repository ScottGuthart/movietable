import type { Metadata } from "next";
import { ReadPage } from "@/components/read/read-page";

export const metadata: Metadata = {
  title: "Privacy policy — MovieTable",
  description: "What MovieTable collects when you sign in, where it is stored, and how to delete it.",
};

export default function PrivacyPage() {
  return (
    <ReadPage title="Privacy policy" updated="September 16, 2026">
      <section>
        <p>
          MovieTable is a ranked ledger of films, made by <a href="https://guth.art" target="_blank" rel="noopener noreferrer author">Scott Guthart</a>.
          This policy describes what the site and app collect, why, and how to remove it. The short version: the table
          works without an account, signing in only stores what sync needs, and you can delete everything yourself
          from the account menu.
        </p>
      </section>

      <section>
        <h2>What is collected</h2>
        <ul>
          <li><strong>Without an account, nothing leaves your device.</strong> Guest ratings and your theme choice are stored in your browser&rsquo;s local storage only.</li>
          <li><strong>Account information.</strong> When you sign in with Google or GitHub, the provider shares your name, email address, and profile picture. When you sign in by email link, only your email address. No password is ever set or stored by MovieTable.</li>
          <li><strong>Your ratings.</strong> The stars and &ldquo;haven&rsquo;t seen&rdquo; marks you give films, saved to your account so they follow you across devices.</li>
        </ul>
      </section>

      <section>
        <h2>How it is used</h2>
        <p>
          Your account information identifies you in the account menu. Your ratings are stored and returned to your
          signed-in devices to build your ranking. That is the whole list. There is no advertising, no analytics
          tracking, no profiling beyond the ranking you see, and nothing is sold or shared for marketing.
        </p>
      </section>

      <section>
        <h2>Where it is stored</h2>
        <p>
          Accounts and ratings are stored in a Supabase project (Postgres and Supabase Auth) operated for MovieTable.
          Ratings rows are protected by row-level security: each signed-in visitor can read and write only their own.
        </p>
      </section>

      <section>
        <h2>Third parties</h2>
        <ul>
          <li><strong>Google and GitHub</strong> handle the sign-in itself; their privacy policies govern what they collect during that step.</li>
          <li><strong>Supabase</strong> hosts the database and authentication service.</li>
          <li><strong>Vercel</strong> serves the website.</li>
        </ul>
        <p>Film scores link out to Metacritic; that site has its own policies.</p>
      </section>

      <section>
        <h2>Cookies and local storage</h2>
        <p>
          MovieTable stores a session token to keep you signed in, your appearance choice, and — for guests — ratings,
          all in your browser&rsquo;s local storage. There are no analytics or advertising cookies.
        </p>
      </section>

      <section>
        <h2>Keeping and deleting your data</h2>
        <p>
          Your account and ratings are kept until you delete them. Open the account menu and choose
          <strong> Delete account</strong>: this permanently deletes your account and every rating saved to it, on the
          server and on the device you used. Clearing ratings instead keeps the account and removes only its ratings.
          Guest ratings never leave your browser; clearing your browser storage removes them.
        </p>
      </section>

      <section>
        <h2>Children</h2>
        <p>MovieTable is not directed at children under 13 and does not knowingly collect their information.</p>
      </section>

      <section>
        <h2>Changes</h2>
        <p>Changes to this policy are posted on this page with a new date above.</p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy can be raised as an issue on the{" "}
          <a href="https://github.com/ScottGuthart/movietable/issues" target="_blank" rel="noopener noreferrer">MovieTable repository</a>.
        </p>
      </section>
    </ReadPage>
  );
}
