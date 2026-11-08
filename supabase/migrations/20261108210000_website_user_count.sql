-- Real, live count of registered surfers, for the homepage's
-- "N+ surfers already connect on Surfmate" line.
create or replace function public.get_website_user_count()
returns integer
language sql
stable security definer
set search_path to 'public'
as $function$
  select count(*)::int from public.profiles;
$function$;

grant execute on function public.get_website_user_count() to anon, authenticated;
