-- Supabase schema for open multi-project gas reserves workspaces
-- Apply via Supabase migrations or run in the Supabase SQL Editor after setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

create table if not exists public.projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  name text not null,
  description text not null default '',
  inputs jsonb not null,
  active_chart_tab text not null default 'pz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Users can view their own projects" on public.projects;
drop policy if exists "Users can insert their own projects" on public.projects;
drop policy if exists "Users can update their own projects" on public.projects;
drop policy if exists "Users can delete their own projects" on public.projects;
drop policy if exists "Allow full access to projects" on public.projects;

create policy "Allow full access to projects"
  on public.projects
  for all
  to anon, authenticated
  using (true)
  with check (true);
