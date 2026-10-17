-- GL-MOS Communication Cloud: encrypted provider credentials
-- This table is server-only. Never add a client-facing RLS policy to it.
create unique index if not exists channel_accounts_workspace_provider_address_uidx
  on public.channel_accounts(workspace_id, provider, account_address)
  where account_address is not null;

create table if not exists public.channel_account_secrets (
  channel_account_id uuid primary key references public.channel_accounts(id) on delete cascade,
  ciphertext text not null,
  iv_hex text not null,
  auth_tag_hex text not null,
  key_version integer not null default 1,
  updated_at timestamptz not null default now()
);

alter table public.channel_account_secrets enable row level security;
revoke all on public.channel_account_secrets from anon, authenticated;
grant all on public.channel_account_secrets to service_role;

comment on table public.channel_account_secrets is
  'Encrypted provider credentials. Access only from trusted server code using service_role and EMAIL_CREDENTIALS_ENCRYPTION_KEY. Never expose rows through client APIs.';
