-- Hardening pass on the website RPCs added in 20261108120000:
--   * get_website_spot_surfed_count now applies the same opt-in + 48h delay
--     rule as get_website_spot_sessions, so the public count never reflects
--     sessions a surfer did not choose to share on the website.
--   * get_website_spot_sessions clamps p_limit to a sane range so an
--     anonymous caller can't force an unbounded scan/response.

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
