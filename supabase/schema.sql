-- Supabase schema for multi-project gas reserves workspaces (per authenticated student user)
-- Apply via Supabase migrations or run in the Supabase SQL Editor after setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

create table if not exists public.projects (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade default auth.uid(),
  name text not null,
  description text not null default '',
  inputs jsonb not null,
  active_chart_tab text not null default 'pz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

drop policy if exists "Allow full access to projects" on public.projects;
drop policy if exists "Users can view their own projects" on public.projects;
drop policy if exists "Users can insert their own projects" on public.projects;
drop policy if exists "Users can update their own projects" on public.projects;
drop policy if exists "Users can delete their own projects" on public.projects;

create policy "Users can view their own projects"
  on public.projects
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own projects"
  on public.projects
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own projects"
  on public.projects
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own projects"
  on public.projects
  for delete
  to authenticated
  using (auth.uid() = user_id);
