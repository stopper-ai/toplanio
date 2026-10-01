begin;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 100),
  created_at timestamptz not null default now()
);
create table public.communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 2 and 60),
  type text not null check (char_length(type) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$'),
  description text not null default '' check (char_length(description) <= 500),
  color text not null default '#FF4D00' check (color ~ '^#[0-9a-fA-F]{6}$'),
  logo_url text check (logo_url is null or (logo_url ~ '^https://' and char_length(logo_url) <= 2048)),
  created_at timestamptz not null default now()
);
create index communities_owner_idx on public.communities(owner_id);
create table public.members (
  community_id uuid not null references public.communities(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index members_user_idx on public.members(user_id);

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.members enable row level security;

create policy profiles_read_self on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_update_self on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy communities_read_owner on public.communities for select to authenticated using (owner_id = (select auth.uid()));
create policy communities_insert_owner on public.communities for insert to authenticated with check (owner_id = (select auth.uid()));
create policy communities_update_owner on public.communities for update to authenticated
  using (owner_id = (select auth.uid())) with check (owner_id = (select auth.uid()));
create policy communities_delete_owner on public.communities for delete to authenticated using (owner_id = (select auth.uid()));
create policy members_read_self_or_owner on public.members for select to authenticated using (
  user_id = (select auth.uid()) or exists (
    select 1 from public.communities c where c.id = community_id and c.owner_id = (select auth.uid())
  )
);
revoke all on public.profiles, public.communities, public.members from anon, authenticated;
grant select on public.profiles, public.communities, public.members to authenticated;
grant update(display_name) on public.profiles to authenticated;
grant insert(owner_id, name, type, slug, description, color, logo_url) on public.communities to authenticated;
grant update(name, type, slug, description, color, logo_url), delete on public.communities to authenticated;

create function public.toplanio_create_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.toplanio_create_profile() from public, anon, authenticated;
create trigger toplanio_profile_after_signup after insert on auth.users
for each row execute function public.toplanio_create_profile();
insert into public.profiles(id) select id from auth.users on conflict (id) do nothing;

create function public.toplanio_add_community_owner() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.members(community_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end;
$$;
revoke all on function public.toplanio_add_community_owner() from public, anon, authenticated;
create trigger toplanio_owner_after_community after insert on public.communities
for each row execute function public.toplanio_add_community_owner();
commit;
