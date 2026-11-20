-- "Most popular events" for the events listing pages: the events the
-- community has actually attended the most, ranked by combined going+went
-- RSVPs on events that have already happened (an explicit "went" is rare —
-- most people never revisit a past RSVP — so "going" on a finished event
-- counts too, same convention as the detail page's past-event headline).
-- Aggregate count only, no attendee identities.

create or replace function public.get_website_top_events(p_limit integer default 6)
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', e.id,
      'title', e.title,
      'location_name', e.location_name,
      'country_code', e.country_code,
      'cover_image_url', e.cover_image_url,
      'event_types', e.event_types,
      'starts_at', e.starts_at,
      'ends_at', e.ends_at,
      'event_year', e.event_year,
      'event_month', e.event_month,
      'timezone', e.timezone,
      'attendee_count', counts.attendee_count
    )
    order by counts.attendee_count desc
  ), '[]'::jsonb)
  from public.events e
  join (
    select ea.event_id, count(*) as attendee_count
    from public.event_attendance ea
    join public.events ev on ev.id = ea.event_id
    where ea.status in ('going', 'went')
      and ev.is_published = true
      and (
        case
          when ev.starts_at is not null then coalesce(ev.ends_at, ev.starts_at)
          when ev.event_year is not null then
            date_trunc('month', make_date(ev.event_year, coalesce(ev.event_month, 1), 1)) + interval '1 month' - interval '1 second'
          else null
        end
      ) < now()
    group by ea.event_id
    order by count(*) desc
    limit least(greatest(coalesce(p_limit, 6), 1), 20)
  ) counts on counts.event_id = e.id
  where e.is_published = true;
$function$;

grant execute on function public.get_website_top_events(integer) to anon, authenticated;
