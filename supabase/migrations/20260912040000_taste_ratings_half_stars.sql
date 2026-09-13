-- Ratings gain half-star steps: 0.5 to 5.0 in increments of 0.5.

alter table taste_ratings drop constraint taste_ratings_stars_check;
alter table taste_ratings alter column stars type numeric(2, 1);
alter table taste_ratings add constraint taste_ratings_stars_check
  check (stars between 0.5 and 5 and stars * 2 = floor(stars * 2));

comment on column taste_ratings.stars is 'Half a star to five in half-star steps; three is neutral for the taste profile, five speaks fully for the film and half a star fully against it.';
