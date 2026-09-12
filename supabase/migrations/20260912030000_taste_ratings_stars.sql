-- Ratings move from thumbs (like / pass) to whole stars, one to five.
--
-- `verdict` keeps two values: 'rated' with a star count, or 'skip' for "haven't seen".
-- Thumbs saved before this change map to the stars the app now treats as their
-- equivalents: like became four stars, pass two.

alter table taste_ratings add column stars smallint check (stars between 1 and 5);
alter table taste_ratings drop constraint taste_ratings_verdict_check;

update taste_ratings set stars = case verdict when 'like' then 4 when 'pass' then 2 end
  where verdict in ('like', 'pass');
update taste_ratings set verdict = 'rated' where verdict in ('like', 'pass');

alter table taste_ratings add constraint taste_ratings_verdict_check check (verdict in ('rated', 'skip'));
alter table taste_ratings add constraint taste_ratings_stars_present check ((verdict = 'rated') = (stars is not null));

comment on column taste_ratings.verdict is '''rated'' with a star count in `stars`, or ''skip'' for a film the visitor has not seen.';
comment on column taste_ratings.stars is 'One to five whole stars; three is neutral for the taste profile, five speaks fully for the film and one fully against it.';
