-- Public website support: curated spot slugs/regions, session opt-in flag,
-- and read-only RPCs for the surfmate.eu Next.js site (anon key, no auth).
--
-- Privacy rules enforced here (see website spec):
--   * Secret spots (spots.visibility <> 'public') are never returned.
--   * Individual sessions require an explicit per-session opt-in
--     (surf_sessions.show_on_website, default false) and are delayed by 48h.
--   * Coordinates returned to the website are rounded to ~1km precision.

-- 1. Curated website fields on spots -----------------------------------------
alter table public.spots
  add column if not exists slug text,
  add column if not exists region text,
  add column if not exists region_slug text,
  add column if not exists is_listed_on_website boolean not null default false;

create unique index if not exists spots_slug_key
  on public.spots (slug)
  where slug is not null;

-- 2. Per-session opt-in for public display on the website -------------------
alter table public.surf_sessions
  add column if not exists show_on_website boolean not null default false;

-- 3. Seed curated spots shown on the homepage spot guide ---------------------
update public.spots set
  slug = 'supertubos', region = 'Peniche', region_slug = 'peniche', is_listed_on_website = true
  where id = '7cac3fec-9a87-5de1-8c54-b7850733143d';

update public.spots set
  slug = 'baleal', region = 'Peniche', region_slug = 'peniche', is_listed_on_website = true
  where id = 'cfce6bf5-d059-563c-833e-0d38e89add33';

update public.spots set
  slug = 'ribeira-d-ilhas', region = 'Ericeira', region_slug = 'ericeira', is_listed_on_website = true
  where id = '89324819-6318-54e2-b91d-011cbde1736e';

update public.spots set
  slug = 'somo', region = 'Cantabria', region_slug = 'cantabria', is_listed_on_website = true
  where id = '3827314e-d1db-5511-8824-6fe86fedac73';

update public.spots set
  slug = 'la-graviere', region = 'Hossegor', region_slug = 'hossegor', is_listed_on_website = true
  where id = '4c9869de-f416-55f9-8bf0-3958750ba917';

update public.spots set
  slug = 'eisbach', region = 'Munich', region_slug = 'munich', is_listed_on_website = true
  where id = '75b77064-de8e-59fe-a31e-a3347e906c66';

-- 4. Spots list for /spots -----------------------------------------------------
create or replace function public.get_website_spots()
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', s.id,
      'slug', s.slug,
      'name', s.name,
      'region', s.region,
      'region_slug', s.region_slug,
      'country_code', s.country_code,
      'latitude', round(s.latitude::numeric, 2),
      'longitude', round(s.longitude::numeric, 2)
    )
    order by s.country_code, s.region, s.name
  ), '[]'::jsonb)
  from public.spots s
  where s.visibility = 'public'
    and s.is_listed_on_website = true
    and s.slug is not null;
$function$;

-- 5. Single spot detail for /spots/[country]/[region]/[spot] ------------------
create or replace function public.get_website_spot(p_slug text)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'id', s.id,
    'slug', s.slug,
    'name', s.name,
    'region', s.region,
    'region_slug', s.region_slug,
    'country_code', s.country_code,
    'latitude', round(s.latitude::numeric, 2),
    'longitude', round(s.longitude::numeric, 2)
  )
  from public.spots s
  where s.slug = p_slug
    and s.visibility = 'public'
    and s.is_listed_on_website = true;
$function$;

-- 6. "Surfmates have surfed here" count (aggregate only, no identities) -------
create or replace function public.get_website_spot_surfed_count(p_slug text)
returns integer
language sql
stable security definer
set search_path to 'public'
as $function$
  select count(distinct ss.user_id)::int
  from public.surf_sessions ss
  join public.spots s on s.id = ss.spot_id
  where s.slug = p_slug
    and s.visibility = 'public'
    and s.is_listed_on_website = true
    and ss.deleted_at is null
    and ss.visibility <> 'only_me'
    and ss.show_on_website = true
    and ss.created_at <= now() - interval '48 hours';
$function$;

-- 7. Public, opted-in, time-delayed sessions for a spot ------------------------
create or replace function public.get_website_spot_sessions(p_slug text, p_limit integer default 12)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ss.id,
      'session_date', ss.session_date,
      'session_time_label', ss.session_time_label,
      'notes', ss.notes,
      'emotions', ss.emotions,
      'highlights', ss.highlights,
      'wave_height', ss.wave_height,
      'media_urls', ss.media_urls,
      'surfer_display_name', p.display_name,
      'surfer_avatar_url', p.avatar_url
    )
    order by ss.session_date desc nulls last, ss.created_at desc
  ), '[]'::jsonb)
  from (
    select ss.*
    from public.surf_sessions ss
    join public.spots s on s.id = ss.spot_id
    where s.slug = p_slug
      and s.visibility = 'public'
      and s.is_listed_on_website = true
      and ss.deleted_at is null
      and ss.visibility <> 'only_me'
      and ss.show_on_website = true
      and ss.created_at <= now() - interval '48 hours'
    order by ss.session_date desc nulls last, ss.created_at desc
    limit least(greatest(coalesce(p_limit, 12), 1), 50)
  ) ss
  join public.profiles p on p.id = ss.user_id;
$function$;

-- 8. "Going" count for an event -------------------------------------------------
create or replace function public.get_website_event_going_count(p_event_id uuid)
returns integer
language sql
stable security definer
set search_path to 'public'
as $function$
  select count(*)::int
  from public.event_attendance ea
  join public.events e on e.id = ea.event_id
  where ea.event_id = p_event_id
    and ea.status = 'going'
    and e.is_published = true;
$function$;

grant execute on function public.get_website_spots() to anon, authenticated;
grant execute on function public.get_website_spot(text) to anon, authenticated;
grant execute on function public.get_website_spot_surfed_count(text) to anon, authenticated;
grant execute on function public.get_website_spot_sessions(text, integer) to anon, authenticated;
grant execute on function public.get_website_event_going_count(uuid) to anon, authenticated;
