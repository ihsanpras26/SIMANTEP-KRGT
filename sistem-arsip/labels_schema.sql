-- Create labels table
create table public.labels (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  color text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for labels
alter table public.labels enable row level security;

-- Create policies for labels (public access for now, similar to other tables)
create policy "Enable read access for all users" on public.labels
  for select using (true);

create policy "Enable insert for all users" on public.labels
  for insert with check (true);

create policy "Enable update for all users" on public.labels
  for update using (true);

create policy "Enable delete for all users" on public.labels
  for delete using (true);

-- Create junction table for many-to-many relationship betwen arsip and labels
create table public.arsip_labels (
  arsip_id bigint references public.arsip(id) on delete cascade not null,
  label_id uuid references public.labels(id) on delete cascade not null,
  assigned_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (arsip_id, label_id)
);

-- Enable RLS for junction table
alter table public.arsip_labels enable row level security;

-- Create policies for junction table
create policy "Enable read access for all users" on public.arsip_labels
  for select using (true);

create policy "Enable insert for all users" on public.arsip_labels
  for insert with check (true);

create policy "Enable update for all users" on public.arsip_labels
  for update using (true);

create policy "Enable delete for all users" on public.arsip_labels
  for delete using (true);
