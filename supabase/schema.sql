-- Supabase schema for multi-project gas reserves workspaces
-- Run this in the Supabase SQL Editor after setting VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env

create table if not exists public.projects (
  id text primary key,
  name text not null,
  description text not null default '',
  inputs jsonb not null,
  active_chart_tab text not null default 'pz',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- Public workspace access policy (adjust if adding user authentication later)
create policy "Allow full access to projects"
  on public.projects
  for all
  using (true)
  with check (true);
