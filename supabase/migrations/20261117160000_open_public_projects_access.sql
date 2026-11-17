-- Migration: open public.projects for anonymous public access (login/signup removed)

alter table public.projects
  alter column user_id drop default;

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
