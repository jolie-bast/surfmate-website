-- Public website support for the Lensmates directory: read-only RPCs that
-- expose only approved lensmate_profiles rows (anon key, no auth), the same
-- pattern as the /spots RPCs. Pending/rejected applications and internal
-- review fields (rejection_reason, reviewed_by_user_id, story_*) never leave
-- the database.

-- 1. Lensmates list for /lensmates ---------------------------------------------
create or replace function public.get_website_lensmates()
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'user_id', lp.user_id,
      'instagram_username', lp.instagram_username,
      'display_name', p.display_name,
      'avatar_url', p.avatar_url,
      'kind', lp.kind,
      'about', lp.about,
      'available_for', lp.available_for,
      'shot_1_url', lp.shot_1_url,
      'shot_2_url', lp.shot_2_url,
      'shot_3_url', lp.shot_3_url
    )
    order by p.display_name nulls last, lp.instagram_username
  ), '[]'::jsonb)
  from public.lensmate_profiles lp
  join public.profiles p on p.id = lp.user_id
  where lp.status = 'approved';
$function$;

-- 2. Single lensmate detail for /lensmates/[instagram] -------------------------
create or replace function public.get_website_lensmate(p_instagram text)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'user_id', lp.user_id,
    'instagram_username', lp.instagram_username,
    'display_name', p.display_name,
    'avatar_url', p.avatar_url,
    'kind', lp.kind,
    'about', lp.about,
    'available_for', lp.available_for,
    'shot_1_url', lp.shot_1_url,
    'shot_2_url', lp.shot_2_url,
    'shot_3_url', lp.shot_3_url
  )
  from public.lensmate_profiles lp
  join public.profiles p on p.id = lp.user_id
  where lower(lp.instagram_username) = lower(p_instagram)
    and lp.status = 'approved';
$function$;

grant execute on function public.get_website_lensmates() to anon, authenticated;
grant execute on function public.get_website_lensmate(text) to anon, authenticated;
