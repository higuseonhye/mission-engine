-- Run this in Supabase SQL Editor to create tables

-- Mission clusters (grouping + worldview)
create table if not exists mission_clusters (
  id text primary key,
  name text not null,
  description text not null,
  mission_ids jsonb default '[]',
  worldview text,
  sort_order int default 0
);

-- Mission connections (enables, depends_on, related)
create table if not exists mission_connections (
  id uuid primary key default gen_random_uuid(),
  from_id text not null,
  to_id text not null,
  type text not null default 'enables',
  unique(from_id, to_id, type)
);

-- Missions (evolving content)
create table if not exists missions (
  id text primary key,
  title text not null,
  problem text not null,
  impact text not null,
  why_it_matters text not null,
  signals jsonb default '[]',
  status text not null default 'Unsolved',
  category text not null default 'AI / Technology',
  worldview text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Mission history (version tracking)
create table if not exists mission_history (
  id uuid primary key default gen_random_uuid(),
  mission_id text not null references missions(id) on delete cascade,
  version int not null,
  snapshot jsonb not null,
  changed_at timestamptz default now(),
  changed_by text
);

create index if not exists mission_history_mission_id on mission_history(mission_id);

-- Trigger to update updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists missions_updated_at on missions;
create trigger missions_updated_at
  before update on missions
  for each row execute function update_updated_at();

-- RLS (allow read for anon, write for authenticated or service role)
alter table missions enable row level security;
alter table mission_history enable row level security;

create policy "Missions are viewable by everyone" on missions for select using (true);
create policy "Missions are insertable by service" on missions for insert with check (true);
create policy "Missions are updatable by service" on missions for update using (true);
create policy "Missions are deletable by service" on missions for delete using (true);

create policy "History is viewable by everyone" on mission_history for select using (true);
create policy "History is insertable by service" on mission_history for insert with check (true);

-- Clusters & connections RLS
alter table mission_clusters enable row level security;
alter table mission_connections enable row level security;
create policy "Clusters viewable by everyone" on mission_clusters for select using (true);
create policy "Clusters writable by service" on mission_clusters for all using (true);
create policy "Connections viewable by everyone" on mission_connections for select using (true);
create policy "Connections writable by service" on mission_connections for all using (true);
