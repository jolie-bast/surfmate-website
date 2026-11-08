-- Grow the website spot guide from the 6 hand-picked launch spots to the
-- spots the community is actually surfing most, and rank the list by real
-- activity instead of alphabetically.

-- Seed slug/region for every additional public spot with >=10 distinct
-- surfers logged (visibility <> 'only_me'), so get_website_spots() can
-- surface them. The original 6 spots keep their existing slug/region.
update public.spots set slug = 'o2-surftown', region = 'Munich', region_slug = 'munich', is_listed_on_website = true where id = 'c9f7864b-8d26-4c39-9fd4-280bb7ca12f9';
update public.spots set slug = 'salinas', region = 'Asturias', region_slug = 'asturias', is_listed_on_website = true where id = '47cbab8f-165f-579d-86b0-db22a65ffb14';
update public.spots set slug = 'costa-caparica', region = 'Costa da Caparica', region_slug = 'costa-da-caparica', is_listed_on_website = true where id = 'b874705a-651f-5349-a83d-600420fba3ea';
update public.spots set slug = 'norre-vorupor', region = 'Thy', region_slug = 'thy', is_listed_on_website = true where id = '76d4f50b-4f9e-5d24-9cbc-507ee78f6a3e';
update public.spots set slug = 'zarautz', region = 'Basque Country', region_slug = 'basque-country', is_listed_on_website = true where id = '4de556bb-367e-5096-be1b-30d55e0ca021';
update public.spots set slug = 'lagide', region = 'Peniche', region_slug = 'peniche', is_listed_on_website = true where id = '000767ff-6b4d-56b2-8637-e691f68e3abe';
update public.spots set slug = 'cantinho', region = 'Peniche', region_slug = 'peniche', is_listed_on_website = true where id = 'b135d5f1-9b9f-4429-9422-56acf2e25e8e';
update public.spots set slug = 'gerra', region = 'Cantabria', region_slug = 'cantabria', is_listed_on_website = true where id = '53d63e48-e456-5c27-ac82-d2211c7097b4';
update public.spots set slug = 'praia-areia-branca', region = 'Lourinhã', region_slug = 'lourinha', is_listed_on_website = true where id = 'f4a08bf6-ae91-52f5-8922-45b323d4b39d';
update public.spots set slug = 'oyambre', region = 'Cantabria', region_slug = 'cantabria', is_listed_on_website = true where id = '5e706ba9-8240-5719-936a-b5e13decd79d';
update public.spots set slug = 'klitmoller', region = 'Thy', region_slug = 'thy', is_listed_on_website = true where id = '7ab81f45-5a6c-53c0-97fb-b493447a8b26';
update public.spots set slug = 'viana-do-castelo', region = 'Viana do Castelo', region_slug = 'viana-do-castelo', is_listed_on_website = true where id = '0ea0c975-b50c-5af6-9591-4e5795331ccc';
update public.spots set slug = 'cabedelo', region = 'Figueira da Foz', region_slug = 'figueira-da-foz', is_listed_on_website = true where id = '6588cd63-818c-5204-8ac3-b88cc7520bee';
update public.spots set slug = 'ferrel', region = 'Peniche', region_slug = 'peniche', is_listed_on_website = true where id = 'c1ceb5f2-4cf6-5c2b-b152-39d466187842';
update public.spots set slug = 'hanstholm', region = 'Thy', region_slug = 'thy', is_listed_on_website = true where id = 'af6c8042-8a58-5b43-8417-0e8263b3e2ef';
update public.spots set slug = 'carcavelos', region = 'Cascais', region_slug = 'cascais', is_listed_on_website = true where id = '907feb8e-1789-5a94-9176-9d415a3461c3';
update public.spots set slug = 'les-bourdaines', region = 'Hossegor', region_slug = 'hossegor', is_listed_on_website = true where id = 'ffd7f1f3-cdb1-5f05-b994-3965c61f9d9e';
update public.spots set slug = 'taghazout-bay', region = 'Agadir', region_slug = 'agadir', is_listed_on_website = true where id = 'b7e3be63-ffae-5541-bcf8-5d4b832c93db';
update public.spots set slug = 'cap-de-lhomy', region = 'Landes', region_slug = 'landes', is_listed_on_website = true where id = '6fa2e396-795e-5148-880d-f42d87548eb0';
update public.spots set slug = 'hendaye-plage', region = 'Basque Country', region_slug = 'basque-country', is_listed_on_website = true where id = '9d280367-0c80-55ae-b484-fe018e88365b';
update public.spots set slug = 'meron', region = 'Cantabria', region_slug = 'cantabria', is_listed_on_website = true where id = '2fc0d72c-5000-5ae2-8a23-1862270a86e0';
update public.spots set slug = 'moliets-plage', region = 'Landes', region_slug = 'landes', is_listed_on_website = true where id = '60832e57-f601-58a6-bde2-9780a12916b9';
update public.spots set slug = 'praia-grande', region = 'Sintra', region_slug = 'sintra', is_listed_on_website = true where id = '2f280659-80b7-519c-841b-a68585ff6b96';

-- Rank by real activity (distinct surfers, excluding only_me sessions) and
-- expose the count so the list can show "N surfers" instead of a fixed
-- order. Spots with no sessions yet sort last, alphabetically.
create or replace function public.get_website_spots()
returns jsonb
language sql
stable security definer
set search_path to 'public'
as $function$
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', ranked.id,
      'slug', ranked.slug,
      'name', ranked.name,
      'region', ranked.region,
      'region_slug', ranked.region_slug,
      'country_code', ranked.country_code,
      'latitude', ranked.latitude,
      'longitude', ranked.longitude,
      'surfer_count', ranked.surfer_count
    )
    order by ranked.surfer_count desc, ranked.country_code, ranked.region, ranked.name
  ), '[]'::jsonb)
  from (
    select
      s.id,
      s.slug,
      s.name,
      s.region,
      s.region_slug,
      s.country_code,
      round(s.latitude::numeric, 2) as latitude,
      round(s.longitude::numeric, 2) as longitude,
      coalesce((
        select count(distinct ss.user_id)
        from public.surf_sessions ss
        where ss.spot_id = s.id
          and ss.deleted_at is null
          and ss.visibility <> 'only_me'
      ), 0)::int as surfer_count
    from public.spots s
    where s.visibility = 'public'
      and s.is_listed_on_website = true
      and s.slug is not null
  ) ranked;
$function$;
