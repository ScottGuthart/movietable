-- Account deletion, called by the signed-in visitor from the account menu.
--
-- App Store and privacy-policy commitments require that an account and its data can be
-- deleted without emailing anyone. Supabase has no client-side self-delete, so this
-- function is the narrow door: it removes only the caller's own auth.users row.
-- Everything else follows the schema: taste_ratings cascades on user deletion, and no
-- other table keys off auth.users.
--
-- SECURITY DEFINER so the function can touch auth.users; the body deletes by
-- auth.uid(), never by a caller-supplied id, so no one can delete another account.
-- Called with a valid session; with no session auth.uid() is null and nothing happens.

create or replace function public.delete_own_account()
returns void
language sql
security definer
set search_path = ''
as $$
  delete from auth.users where id = (select auth.uid());
$$;

comment on function public.delete_own_account is 'Deletes the caller''s own auth.users row; taste_ratings cascades. The only client-reachable account deletion path.';

revoke all on function public.delete_own_account() from public;
revoke all on function public.delete_own_account() from anon;
grant execute on function public.delete_own_account() to authenticated;
