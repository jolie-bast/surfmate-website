-- Personal partner submit links + partner search for the event-partner wizard.
-- Builds on the existing public.partners table (already has slug/logo_url used
-- for the /p/<slug> app-referral landing pages). submit_token is a separate
-- secret from slug, since slug is already public via those referral links.

alter table public.partners
  add column if not exists submit_token text unique;

-- 1. Mint/return a partner's personal submit link token (admin only) -----------
create or replace function public.ensure_partner_submit_token(p_partner_id uuid)
returns text
language plpgsql
security definer
set search_path to 'public', 'extensions'
as $function$
declare
  v_token text;
begin
  if not public.is_user_admin(auth.uid()) then
    raise exception 'Not authorized.';
  end if;

  select submit_token into v_token
  from public.partners
  where id = p_partner_id;

  if v_token is null then
    v_token := encode(extensions.gen_random_bytes(16), 'hex');

    update public.partners
    set submit_token = v_token
    where id = p_partner_id;
  end if;

  return v_token;
end;
$function$;

grant execute on function public.ensure_partner_submit_token(uuid) to authenticated;

-- 2. Resolve a personal submit link (slug + token) ------------------------------
create or replace function public.verify_partner_submit_link(p_slug text, p_token text)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  select coalesce(
    (
      select jsonb_build_object(
        'found', true,
        'id', p.id,
        'name', p.name,
        'kind', p.kind,
        'logo_url', p.logo_url
      )
      from public.partners p
      where p.slug = lower(btrim(coalesce(p_slug, '')))
        and p.submit_token is not null
        and p.submit_token = coalesce(p_token, '')
      limit 1
    ),
    jsonb_build_object('found', false)
  );
$function$;

grant execute on function public.verify_partner_submit_link(text, text) to anon, authenticated;

-- 3. Search partners for the wizard's step 1 (any kind) --------------------------
create or replace function public.search_event_submit_partners(p_access_key text, p_query text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_query text := btrim(coalesce(p_query, ''));
begin
  if not public.verify_partner_event_submit_access(p_access_key) then
    raise exception 'Invalid or missing partner access key.';
  end if;

  if char_length(v_query) < 2 then
    return '[]'::jsonb;
  end if;

  return coalesce(
    (
      select jsonb_agg(
        jsonb_build_object(
          'id', p.id,
          'name', p.name,
          'kind', p.kind,
          'logo_url', p.logo_url
        )
        order by p.name
      )
      from (
        select id, name, kind, logo_url
        from public.partners
        where name ilike '%' || v_query || '%'
        order by name
        limit 10
      ) p
    ),
    '[]'::jsonb
  );
end;
$function$;

grant execute on function public.search_event_submit_partners(text, text) to anon, authenticated;

-- 4. submit_partner_event: accept an existing/verified partner_id ---------------
-- CREATE OR REPLACE keys off the full argument-type list, and this adds two
-- trailing params, so it would otherwise create a second overload alongside
-- the old 18-arg one instead of replacing it. Drop that old signature first.
drop function if exists public.submit_partner_event(
  text, text, text, text, text, double precision, double precision, text,
  timestamp with time zone, timestamp with time zone, text[], text,
  text, text, text, text, text, text
);

create or replace function public.submit_partner_event(
  p_access_key text,
  p_partner_name text,
  p_title text,
  p_location_name text,
  p_country_code text,
  p_latitude double precision,
  p_longitude double precision,
  p_schedule_type text,
  p_starts_at timestamp with time zone,
  p_ends_at timestamp with time zone,
  p_event_types text[],
  p_submitter_email text,
  p_website_url text default null,
  p_cover_image_url text default null,
  p_logo_url text default null,
  p_submitter_note text default null,
  p_description text default null,
  p_timezone text default 'Europe/Berlin',
  p_partner_id uuid default null,
  p_partner_token text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user_id uuid := auth.uid();
  v_submitter_email text := nullif(lower(btrim(coalesce(p_submitter_email, ''))), '');
  v_partner_name text := btrim(coalesce(p_partner_name, ''));
  v_title text := btrim(coalesce(p_title, ''));
  v_location_name text := btrim(coalesce(p_location_name, ''));
  v_country_code text := nullif(upper(btrim(coalesce(p_country_code, ''))), '');
  v_schedule_type text := btrim(coalesce(p_schedule_type, ''));
  v_event_types text[] := coalesce(p_event_types, '{}'::text[]);
  v_website_url text := nullif(btrim(coalesce(p_website_url, '')), '');
  v_cover_image_url text := nullif(btrim(coalesce(p_cover_image_url, '')), '');
  v_logo_url text := nullif(btrim(coalesce(p_logo_url, '')), '');
  v_note text := nullif(btrim(coalesce(p_submitter_note, '')), '');
  v_description text := nullif(btrim(coalesce(p_description, '')), '');
  v_timezone text := coalesce(nullif(btrim(coalesce(p_timezone, '')), ''), 'Europe/Berlin');
  v_pending_count integer;
  v_event_id uuid;
  v_partner_id uuid;
  v_partner_verified boolean := false;
  v_next_sort_order integer;
  v_allowed_types constant text[] := array[
    'shortboard', 'longboard', 'bodyboard', 'festival', 'contest',
    'film', 'meetup', 'qs', 'ct', 'cs', 'national', 'isa', 'bwt', 'sup',
    'skate', 'clean_up', 'rapid'
  ]::text[];
begin
  -- A personal link's token, when present, must match the claimed partner_id:
  -- never trust a client-supplied partner_id alone for identity. A verified
  -- token is sufficient authorization on its own (personal links carry no
  -- generic access key), so check it before the generic-key gate below.
  if p_partner_token is not null and p_partner_id is not null then
    select exists (
      select 1 from public.partners p
      where p.id = p_partner_id
        and p.submit_token is not null
        and p.submit_token = p_partner_token
    ) into v_partner_verified;

    if not v_partner_verified then
      raise exception 'Invalid partner link.';
    end if;
  end if;

  if not v_partner_verified and not public.verify_partner_event_submit_access(p_access_key) then
    raise exception 'Invalid or missing partner access key.';
  end if;

  if v_submitter_email is null then
    raise exception 'Enter your email address so we can reach you.';
  end if;

  if v_submitter_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Enter a valid email address (e.g. you@example.com).';
  end if;

  if char_length(v_partner_name) < 1 or char_length(v_partner_name) > 120 then
    raise exception 'Partner / organizer name must be between 1 and 120 characters.';
  end if;

  if char_length(v_title) < 1 or char_length(v_title) > 200 then
    raise exception 'Event name must be between 1 and 200 characters.';
  end if;

  if char_length(v_location_name) < 1 or char_length(v_location_name) > 200 then
    raise exception 'Location is required.';
  end if;

  if p_latitude is null or p_longitude is null then
    raise exception 'Pick a location from search so coordinates are set.';
  end if;

  if v_country_code is not null and v_country_code !~ '^[A-Z]{2}$' then
    raise exception 'Country code must be a 2-letter ISO code.';
  end if;

  if v_schedule_type not in ('exact', 'exact_datetime') then
    raise exception 'Only exact dates (with or without times) are allowed for partner submissions.';
  end if;

  if p_starts_at is null then
    raise exception 'Start date is required.';
  end if;

  if p_ends_at is not null and p_ends_at < p_starts_at then
    raise exception 'End must be on or after the start.';
  end if;

  if coalesce(array_length(v_event_types, 1), 0) < 1 then
    raise exception 'Select at least one event type.';
  end if;

  if not (v_event_types <@ v_allowed_types) then
    raise exception 'One or more event types are not allowed.';
  end if;

  if v_website_url is not null and char_length(v_website_url) > 500 then
    raise exception 'Website URL is too long.';
  end if;

  if v_website_url is not null and v_website_url !~* '^https?://' then
    raise exception 'Website link must start with http:// or https://';
  end if;

  if v_cover_image_url is not null and char_length(v_cover_image_url) > 1000 then
    raise exception 'Cover image URL is too long.';
  end if;

  if v_logo_url is not null and char_length(v_logo_url) > 1000 then
    raise exception 'Logo URL is too long.';
  end if;

  if v_note is not null and char_length(v_note) > 500 then
    raise exception 'Note must be at most 500 characters.';
  end if;

  if v_description is not null and char_length(v_description) > 600 then
    raise exception 'Description must be at most 600 characters.';
  end if;

  begin
    perform timezone(v_timezone, now());
  exception
    when others then
      raise exception 'Timezone is invalid.';
  end;

  select count(*)::integer
  into v_pending_count
  from public.events e
  where e.submission_source = 'partner'
    and e.submission_status = 'pending'
    and lower(btrim(e.submitter_email)) = v_submitter_email;

  if v_pending_count >= 10 then
    raise exception 'You already have 10 partner events waiting for review.';
  end if;

  insert into public.events (
    title,
    description,
    location_name,
    country_code,
    latitude,
    longitude,
    schedule_type,
    starts_at,
    ends_at,
    timezone,
    event_types,
    website_url,
    cover_image_url,
    logo_url,
    is_published,
    submission_source,
    submission_status,
    submitted_by_user_id,
    submitter_email,
    partner_name,
    submitted_at,
    submitter_note
  )
  values (
    v_title,
    v_description,
    v_location_name,
    v_country_code,
    p_latitude,
    p_longitude,
    v_schedule_type,
    p_starts_at,
    p_ends_at,
    v_timezone,
    v_event_types,
    v_website_url,
    v_cover_image_url,
    v_logo_url,
    false,
    'partner',
    'pending',
    v_user_id,
    v_submitter_email,
    v_partner_name,
    now(),
    v_note
  )
  returning id into v_event_id;

  if v_partner_verified then
    -- Personal link: identity already established, use it as-is. Don't
    -- opportunistically overwrite the partner's profile from form fields.
    v_partner_id := p_partner_id;
  elsif p_partner_id is not null then
    -- Picked from the step-1 search: trust the id over the free-text name.
    select p.id into v_partner_id
    from public.partners p
    where p.id = p_partner_id;
  end if;

  if v_partner_id is null then
    select p.id
    into v_partner_id
    from public.partners p
    where p.kind = 'event_series'
      and lower(btrim(p.name)) = lower(v_partner_name)
    order by p.created_at asc
    limit 1;

    if v_partner_id is null then
      insert into public.partners (
        kind,
        name,
        logo_url,
        website_url,
        email,
        is_published,
        hide_logo_on_website
      )
      values (
        'event_series',
        v_partner_name,
        v_logo_url,
        v_website_url,
        v_submitter_email,
        false,
        false
      )
      returning id into v_partner_id;
    else
      update public.partners p
      set
        logo_url = coalesce(p.logo_url, v_logo_url),
        website_url = coalesce(p.website_url, v_website_url),
        email = coalesce(p.email, v_submitter_email),
        updated_at = now()
      where p.id = v_partner_id;
    end if;
  end if;

  select coalesce(max(pe.sort_order), -1) + 1
  into v_next_sort_order
  from public.partner_events pe
  where pe.partner_id = v_partner_id;

  insert into public.partner_events (partner_id, event_id, sort_order)
  values (v_partner_id, v_event_id, v_next_sort_order)
  on conflict (event_id) do update
  set
    partner_id = excluded.partner_id,
    sort_order = excluded.sort_order;

  perform public.queue_event_submission_email(v_event_id, 'submitted');

  return v_event_id;
end;
$function$;

grant execute on function public.submit_partner_event(
  text, text, text, text, text, double precision, double precision, text,
  timestamp with time zone, timestamp with time zone, text[], text,
  text, text, text, text, text, text, uuid, text
) to anon, authenticated;
