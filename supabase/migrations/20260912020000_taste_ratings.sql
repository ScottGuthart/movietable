-- Taste verdicts for signed-in visitors, so ratings follow an account across devices.
--
-- Guests keep their verdicts in localStorage; this table only exists for people who
-- chose to sign in. Rows are keyed by the visitor and the Metacritic film slug, so a
-- film that leaves the catalogue keeps its verdict without a foreign key to movies.

create table taste_ratings (
  user_id uuid not null references auth.users (id) on delete cascade,
  slug text not null,
  verdict text not null check (verdict in ('like', 'pass', 'skip')),
  updated_at timestamptz not null default now(),
  primary key (user_id, slug)
);

comment on table taste_ratings is 'One verdict per signed-in visitor per film; merged with localStorage on the client, newest updated_at wins.';
comment on column taste_ratings.verdict is 'like and pass shape the taste profile; skip only hides a film from the starter hand.';

alter table taste_ratings enable row level security;

create policy "visitors read their own ratings" on taste_ratings
  for select to authenticated using (user_id = (select auth.uid()));
create policy "visitors add their own ratings" on taste_ratings
  for insert to authenticated with check (user_id = (select auth.uid()));
create policy "visitors change their own ratings" on taste_ratings
  for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "visitors remove their own ratings" on taste_ratings
  for delete to authenticated using (user_id = (select auth.uid()));
