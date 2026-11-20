-- Single event detail for /events/[eventId] (surfmate.eu and surf-events.com),
-- same privacy posture as the spots/lensmates detail RPCs: full event info,
-- but attendee identities never leave the database — only aggregate counts
-- (see get_website_event_attendance_counts below).

create or replace function public.get_website_event(p_event_id uuid)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'id', e.id,
    'title', e.title,
    'description', e.description,
    'schedule_type', e.schedule_type,
    'event_year', e.event_year,
    'event_month', e.event_month,
    'starts_at', e.starts_at,
    'ends_at', e.ends_at,
    'timezone', e.timezone,
    'location_name', e.location_name,
    'country_code', e.country_code,
    'latitude', e.latitude,
    'longitude', e.longitude,
    'event_types', e.event_types,
    'cover_image_url', e.cover_image_url,
    'website_url', e.website_url,
    'live_heats_url', e.live_heats_url,
    'instagram_username', e.instagram_username,
    'is_partner', e.is_partner,
    'partner_name', e.partner_name,
    'logo_url', e.logo_url,
    'is_expired', e.is_expired,
    'community_discount_percent', e.community_discount_percent,
    'community_discount_applies_to', e.community_discount_applies_to,
    'community_discount_custom_label', e.community_discount_custom_label,
    'community_discount_button_label', e.community_discount_button_label,
    'linked_spots', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', s.id,
          'name', s.name,
          'country_code', s.country_code,
          -- Only point at a spot's own page when it actually has one.
          'slug', case when s.visibility = 'public' and s.is_listed_on_website = true then s.slug else null end,
          'region_slug', case when s.visibility = 'public' and s.is_listed_on_website = true then s.region_slug else null end
        )
        order by es.sort_order
      )
      from public.event_spots es
      join public.spots s on s.id = es.spot_id
      where es.event_id = e.id
    ), '[]'::jsonb)
  )
  from public.events e
  where e.id = p_event_id
    and e.is_published = true;
$function$;

-- Aggregate RSVP counts for the detail page ("4 going · 1 maybe"), mirroring
-- the app's attendance summary but deliberately without names or avatars.
create or replace function public.get_website_event_attendance_counts(p_event_id uuid)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select jsonb_build_object(
    'going', count(*) filter (where ea.status = 'going'),
    'maybe', count(*) filter (where ea.status = 'maybe'),
    'went', count(*) filter (where ea.status = 'went')
  )
  from public.event_attendance ea
  join public.events e on e.id = ea.event_id
  where ea.event_id = p_event_id
    and e.is_published = true;
$function$;

grant execute on function public.get_website_event(uuid) to anon, authenticated;
grant execute on function public.get_website_event_attendance_counts(uuid) to anon, authenticated;
