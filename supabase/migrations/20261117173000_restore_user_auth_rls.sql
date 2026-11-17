-- Migration: restore authenticated student RLS on public.projects

alter table public.projects
  alter column user_id set default auth.uid();

delete from public.projects where user_id is null;

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
