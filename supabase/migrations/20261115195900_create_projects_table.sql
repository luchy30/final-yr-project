-- Migration: create public.projects workspace table and RLS policy

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

drop policy if exists "Allow full access to projects" on public.projects;

create policy "Allow full access to projects"
  on public.projects
  for all
  using (true)
  with check (true);
