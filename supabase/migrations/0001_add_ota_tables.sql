-- sijagakali-ota/supabase/migrations/0001_add_ota_tables.sql

alter table device_configs
  add column if not exists firmware_version text,
  add column if not exists firmware_updated_at timestamptz;

create table if not exists firmware_releases (
  id uuid primary key default gen_random_uuid(),
  version text not null unique,
  r2_key text not null,
  file_size_bytes bigint not null,
  notes text,
  uploaded_by uuid references admins(id),
  created_at timestamptz not null default now()
);

create table if not exists firmware_updates (
  id uuid primary key default gen_random_uuid(),
  deployment_slug text not null,
  device_id text not null,
  foreign key (deployment_slug, device_id) references device_configs (deployment_slug, device_id),
  firmware_release_id uuid not null references firmware_releases(id),
  requested_by uuid references admins(id),
  requested_at timestamptz not null default now(),
  mqtt_request_id uuid not null,
  status text not null default 'pending',
  ack_detail text,
  acked_at timestamptz
);

alter table firmware_releases enable row level security;
alter table firmware_updates enable row level security;
-- Deny-by-default: this backend always connects with the service-role key,
-- which bypasses RLS. These policies are defense-in-depth only, in case the
-- anon key is ever used against these tables from somewhere else.
