-- Preflight: 本番スキーマ（正しいRLSのみ）
-- 「壊れたポリシー」の例は docs/incident.md を参照。このファイルには含めない。

create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now()
);

create table public.tenants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.memberships (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (tenant_id, user_id)
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  title text not null,
  findings jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index reports_tenant_idx on public.reports(tenant_id);

create table public.subscriptions (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  stripe_customer_id text,
  stripe_subscription_id text,
  status text not null default 'inactive',
  plan text not null default 'free',
  updated_at timestamptz not null default now()
);

-- メンバー判定（security definer で memberships の RLS 再帰を回避）
create or replace function public.is_member(t uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships m where m.tenant_id = t and m.user_id = auth.uid());
$$;

alter table public.profiles      enable row level security;
alter table public.tenants       enable row level security;
alter table public.memberships   enable row level security;
alter table public.reports       enable row level security;
alter table public.subscriptions enable row level security;

create policy "profiles: self read"   on public.profiles for select using (id = auth.uid());
create policy "profiles: self update" on public.profiles for update using (id = auth.uid());

create policy "tenants: members read" on public.tenants for select using (public.is_member(id));

create policy "memberships: same tenant read" on public.memberships for select using (public.is_member(tenant_id));

create policy "reports: members read"   on public.reports for select using (public.is_member(tenant_id));
create policy "reports: members insert" on public.reports for insert with check (public.is_member(tenant_id));
create policy "reports: members delete" on public.reports for delete using (public.is_member(tenant_id));

-- subscriptions は読み取りのみ。書き込みは Stripe webhook（service_role）だけ。
create policy "subscriptions: members read" on public.subscriptions for select using (public.is_member(tenant_id));

-- サインアップ時: profile + 個人テナント + owner membership + サンプル診断レポート
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare t_id uuid;
begin
  insert into public.profiles (id, email) values (new.id, new.email);
  insert into public.tenants (name, owner_id) values (split_part(new.email, '@', 1) || ' のワークスペース', new.id)
    returning id into t_id;
  insert into public.memberships (tenant_id, user_id, role) values (t_id, new.id, 'owner');
  insert into public.subscriptions (tenant_id) values (t_id);
  insert into public.reports (tenant_id, title, findings) values (
    t_id, 'サンプル: 公開前診断',
    '[{"severity":"high","item":"RLS","note":"reports テーブルに RLS 未設定（修正済み例）"},
      {"severity":"medium","item":"env","note":"NEXT_PUBLIC_ に秘密鍵を置いていないか確認"},
      {"severity":"low","item":"webhook","note":"Stripe 署名検証の有無"}]'::jsonb);
  return new;
end; $$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function public.handle_new_user();
