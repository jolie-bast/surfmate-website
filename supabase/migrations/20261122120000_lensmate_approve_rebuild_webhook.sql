-- Trigger an immediate GitHub Actions rebuild+deploy of the static website
-- whenever a lensmate_profiles row transitions into status = 'approved'.
--
-- Without this, newly approved Lensmates only go live on the next push to
-- `main` or the daily 03:17 UTC cron in .github/workflows/static.yml.
--
-- Requires a GitHub PAT (fine-grained, "Actions: Read and write" on the
-- jolie-bast/surfmate-website repo only) stored in Supabase Vault under the
-- name 'github_actions_pat'. Create it once via the Supabase SQL editor
-- (never commit the token itself):
--
--   select vault.create_secret('<the PAT value>', 'github_actions_pat');
--
-- pg_net is Supabase's extension for making HTTP calls from Postgres.
create extension if not exists pg_net with schema extensions;

create or replace function public.trigger_website_rebuild_on_lensmate_approve()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_token text;
begin
  if new.status = 'approved' and old.status is distinct from new.status then
    select decrypted_secret into v_token
    from vault.decrypted_secrets
    where name = 'github_actions_pat'
    limit 1;

    if v_token is not null then
      perform net.http_post(
        url := 'https://api.github.com/repos/jolie-bast/surfmate-website/actions/workflows/static.yml/dispatches',
        headers := jsonb_build_object(
          'Authorization', 'Bearer ' || v_token,
          'Accept', 'application/vnd.github+json',
          'Content-Type', 'application/json'
        ),
        body := jsonb_build_object('ref', 'main')
      );
    end if;
  end if;

  return new;
end;
$function$;

drop trigger if exists lensmate_approved_rebuild on public.lensmate_profiles;

create trigger lensmate_approved_rebuild
after update on public.lensmate_profiles
for each row
execute function public.trigger_website_rebuild_on_lensmate_approve();
