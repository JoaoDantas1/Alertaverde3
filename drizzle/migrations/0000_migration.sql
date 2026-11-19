-- Roles
create type public.app_role as enum ('admin', 'equipe');
create type public.report_status as enum ('recebida', 'em_analise', 'em_atendimento', 'resolvida', 'descartada');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_team(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin', 'equipe'))
$$;

create policy "Users read own roles" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- Reports
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  protocol text not null unique default ('AV-' || to_char(now() at time zone 'America/Sao_Paulo', 'YYMMDD') || '-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8))),
  description text not null,
  latitude double precision not null,
  longitude double precision not null,
  location_accuracy double precision,
  location_source text not null default 'gps',
  reference_point text,
  occurred_at timestamptz not null default now(),
  reporter_name text,
  reporter_contact text,
  photo_paths text[] not null default '{}',
  status public.report_status not null default 'recebida',
  region_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reports_location_source_chk check (location_source in ('gps', 'manual')),
  constraint reports_description_len check (char_length(description) between 10 and 2000)
);
create index reports_created_at_idx on public.reports (created_at desc);
grant select on public.reports to authenticated;
grant all on public.reports to service_role;
alter table public.reports enable row level security;
create policy "Team reads reports" on public.reports for select to authenticated
  using (public.is_team(auth.uid()));

-- Report status history
create table public.report_updates (
  id uuid primary key default gen_random_uuid(),
  report_id uuid not null references public.reports(id) on delete cascade,
  status public.report_status not null,
  note text,
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint report_updates_note_len check (note is null or char_length(note) <= 1000)
);
create index report_updates_report_idx on public.report_updates (report_id, created_at);
grant select, insert on public.report_updates to authenticated;
grant all on public.report_updates to service_role;
alter table public.report_updates enable row level security;
create policy "Team reads updates" on public.report_updates for select to authenticated
  using (public.is_team(auth.uid()));
create policy "Team adds updates" on public.report_updates for insert to authenticated
  with check (public.is_team(auth.uid()) and created_by = auth.uid());

-- First history entry when a report arrives
create or replace function public.report_created_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.report_updates (report_id, status, note)
  values (new.id, 'recebida', 'Denúncia registrada pelo morador.');
  return new;
end $$;
create trigger reports_after_insert after insert on public.reports
  for each row execute function public.report_created_history();

-- New status entries move the report's current status
create or replace function public.report_update_apply()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.reports set status = new.status, updated_at = now() where id = new.report_id;
  return new;
end $$;
create trigger report_updates_after_insert after insert on public.report_updates
  for each row execute function public.report_update_apply();

-- Public, privacy-safe map points (approximate location, no personal data)
create or replace function public.public_report_points()
returns table (id uuid, latitude double precision, longitude double precision, status public.report_status, created_at timestamptz, region_id text)
language sql stable security definer set search_path = public as $$
  select r.id, round(r.latitude::numeric, 3)::double precision, round(r.longitude::numeric, 3)::double precision,
         r.status, r.created_at, r.region_id
  from public.reports r
  where r.status <> 'descartada' and r.created_at > now() - interval '365 days'
  order by r.created_at desc
  limit 1000
$$;
grant execute on function public.public_report_points() to anon, authenticated;

-- Public tracking by protocol (no personal data)
create or replace function public.track_report(_protocol text)
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'protocol', r.protocol,
    'status', r.status,
    'created_at', r.created_at,
    'occurred_at', r.occurred_at,
    'region_id', r.region_id,
    'photo_count', coalesce(array_length(r.photo_paths, 1), 0),
    'updates', coalesce((
      select jsonb_agg(jsonb_build_object('status', u.status, 'note', u.note, 'created_at', u.created_at) order by u.created_at)
      from public.report_updates u where u.report_id = r.id
    ), '[]'::jsonb)
  )
  from public.reports r
  where r.protocol = upper(trim(_protocol))
$$;
grant execute on function public.track_report(text) to anon, authenticated;

-- Project owner becomes admin once their e-mail is confirmed
create or replace function public.grant_owner_admin()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null and lower(new.email) = 'joaozinho906001@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  end if;
  return new;
end $$;
create trigger on_auth_user_owner_insert after insert on auth.users
  for each row execute function public.grant_owner_admin();
create trigger on_auth_user_owner_confirm after update of email_confirmed_at on auth.users
  for each row execute function public.grant_owner_admin();