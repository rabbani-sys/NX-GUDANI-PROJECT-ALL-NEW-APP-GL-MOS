-- GL-MOS Communication Cloud: initial multi-tenant schema
-- Run in Supabase SQL Editor or via the Supabase migration workflow.
-- Provider secrets must be stored server-side; never place them in client tables.

create extension if not exists pgcrypto;

create table if not exists public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique,
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','staff','partner','member','viewer')),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  full_name text not null,
  primary_email text,
  phone text,
  organization_name text,
  contact_type text not null default 'lead' check (contact_type in ('candidate','employer','recruiter','partner','student','lead','customer','other')),
  status text not null default 'active' check (status in ('active','new','follow_up','inactive','suppressed')),
  tags text[] not null default '{}',
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contacts_workspace_name_idx on public.contacts(workspace_id, full_name);
create index if not exists contacts_workspace_email_idx on public.contacts(workspace_id, lower(primary_email));

create table if not exists public.channel_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  provider text not null check (provider in ('hostinger','imap_smtp','gmail','microsoft','whatsapp_business','telegram','facebook','instagram','linkedin','youtube')),
  display_name text not null,
  account_address text,
  status text not null default 'pending' check (status in ('pending','connected','error','disconnected')),
  capabilities jsonb not null default '{}'::jsonb,
  last_synced_at timestamptz,
  last_error_code text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists channel_accounts_workspace_idx on public.channel_accounts(workspace_id, provider);

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_account_id uuid references public.channel_accounts(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  provider_thread_id text,
  channel text not null check (channel in ('email','whatsapp','telegram','facebook','instagram','linkedin','youtube','internal_chat')),
  subject text,
  status text not null default 'open' check (status in ('open','pending','resolved','archived')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  assigned_to uuid references auth.users(id) on delete set null,
  last_message_at timestamptz,
  unread_count integer not null default 0 check (unread_count >= 0),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists conversations_workspace_activity_idx on public.conversations(workspace_id, last_message_at desc nulls last);
create index if not exists conversations_assignee_status_idx on public.conversations(workspace_id, assigned_to, status);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  channel_account_id uuid references public.channel_accounts(id) on delete set null,
  provider_message_id text,
  direction text not null check (direction in ('inbound','outbound','draft','system')),
  sender_address text,
  recipient_addresses text[] not null default '{}',
  subject text,
  body_text text,
  body_html text,
  delivery_status text not null default 'not_applicable' check (delivery_status in ('not_applicable','draft','queued','sent','delivered','bounced','failed','read')),
  sent_at timestamptz,
  received_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists messages_conversation_created_idx on public.messages(conversation_id, created_at desc);
create index if not exists messages_workspace_created_idx on public.messages(workspace_id, created_at desc);

create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null,
  channel text not null default 'email' check (channel in ('email','whatsapp','telegram','facebook','instagram','linkedin')),
  status text not null default 'draft' check (status in ('draft','scheduled','sending','paused','completed','cancelled','failed')),
  subject text,
  body_text text,
  body_html text,
  audience_filter jsonb not null default '{}'::jsonb,
  scheduled_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists campaigns_workspace_status_idx on public.campaigns(workspace_id, status, created_at desc);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  conversation_id uuid references public.conversations(id) on delete set null,
  title text not null,
  description text,
  status text not null default 'open' check (status in ('open','in_progress','completed','cancelled')),
  priority text not null default 'normal' check (priority in ('low','normal','high','urgent')),
  due_at timestamptz,
  assigned_to uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists tasks_workspace_due_idx on public.tasks(workspace_id, status, due_at);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text not null,
  resource_id uuid,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_events_workspace_created_idx on public.audit_events(workspace_id, created_at desc);

-- SECURITY DEFINER helper avoids recursive membership policies.
create or replace function public.is_workspace_member(target_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
  );
$$;
revoke all on function public.is_workspace_member(uuid) from public;
grant execute on function public.is_workspace_member(uuid) to authenticated;

create or replace function public.has_workspace_role(target_workspace_id uuid, allowed_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace_id
      and wm.user_id = auth.uid()
      and wm.role = any(allowed_roles)
  );
$;
revoke all on function public.has_workspace_role(uuid, text[]) from public;
grant execute on function public.has_workspace_role(uuid, text[]) to authenticated;

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.contacts enable row level security;
alter table public.channel_accounts enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.campaigns enable row level security;
alter table public.tasks enable row level security;
alter table public.audit_events enable row level security;

create policy "workspace members or creator can view workspace" on public.workspaces
for select to authenticated
using (created_by = auth.uid() or public.is_workspace_member(id));
create policy "authenticated users can create workspace" on public.workspaces
for insert to authenticated
with check (created_by = auth.uid());
create policy "workspace admins can update workspace" on public.workspaces
for update to authenticated
using (created_by = auth.uid() or public.has_workspace_role(id, array['owner','admin']))
with check (created_by = auth.uid() or public.has_workspace_role(id, array['owner','admin']));

create policy "members can view workspace memberships" on public.workspace_members
for select to authenticated
using (user_id = auth.uid() or public.is_workspace_member(workspace_id));
create policy "workspace creator or admins can add members" on public.workspace_members
for insert to authenticated
with check (
  (user_id = auth.uid() and exists (select 1 from public.workspaces w where w.id = workspace_id and w.created_by = auth.uid()))
  or public.has_workspace_role(workspace_id, array['owner','admin'])
);
create policy "workspace admins can update memberships" on public.workspace_members
for update to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']))
with check (public.has_workspace_role(workspace_id, array['owner','admin']));
create policy "workspace admins can remove memberships" on public.workspace_members
for delete to authenticated
using (public.has_workspace_role(workspace_id, array['owner','admin']));

create policy "members access contacts" on public.contacts for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members access channel accounts" on public.channel_accounts for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members access conversations" on public.conversations for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members access messages" on public.messages for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members access campaigns" on public.campaigns for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members access tasks" on public.tasks for all to authenticated
using (public.is_workspace_member(workspace_id)) with check (public.is_workspace_member(workspace_id));
create policy "members can view audit events" on public.audit_events for select to authenticated
using (public.is_workspace_member(workspace_id));
create policy "members can append audit events" on public.audit_events for insert to authenticated
with check (public.is_workspace_member(workspace_id) and (actor_user_id is null or actor_user_id = auth.uid()));

comment on table public.channel_accounts is 'Non-secret connection metadata only. OAuth tokens and mailbox passwords must be stored in server-only encrypted secrets.';
comment on table public.audit_events is 'Append-only from the application perspective; do not grant update/delete to normal workspace members.';
