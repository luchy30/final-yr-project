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

-- Student profiles and login tracking (per authenticated student user)
create table if not exists public.student_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  institution text not null default '',
  login_count integer not null default 1,
  last_login_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profiles enable row level security;

drop policy if exists "Students can view their own profile" on public.student_profiles;
drop policy if exists "Students can insert their own profile" on public.student_profiles;
drop policy if exists "Students can update their own profile" on public.student_profiles;

create policy "Students can view their own profile"
  on public.student_profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Students can insert their own profile"
  on public.student_profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Students can update their own profile"
  on public.student_profiles
  for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create or replace function public.handle_new_student_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.student_profiles (
    id,
    email,
    full_name,
    institution,
    login_count,
    last_login_at,
    created_at,
    updated_at
  )
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'institution', ''),
    1,
    now(),
    now(),
    now()
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_student_user();

create or replace function public.record_student_login(
  p_full_name text default null,
  p_institution text default null
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    return;
  end if;

  v_email := coalesce(auth.jwt() ->> 'email', '');

  insert into public.student_profiles (
    id,
    email,
    full_name,
    institution,
    login_count,
    last_login_at,
    created_at,
    updated_at
  )
  values (
    v_uid,
    v_email,
    coalesce(nullif(trim(p_full_name), ''), ''),
    coalesce(nullif(trim(p_institution), ''), ''),
    1,
    now(),
    now(),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case
      when coalesce(nullif(trim(p_full_name), ''), '') <> '' then trim(p_full_name)
      else public.student_profiles.full_name
    end,
    institution = case
      when coalesce(nullif(trim(p_institution), ''), '') <> '' then trim(p_institution)
      else public.student_profiles.institution
    end,
    login_count = public.student_profiles.login_count + 1,
    last_login_at = now(),
    updated_at = now();
end;
$$;

grant execute on function public.record_student_login(text, text) to authenticated;
