# GL-MOS Communication Cloud

**One Contact. Every Channel. One Unified Timeline.**

A Next.js App Router starter for a unified communications and marketing workspace inside the GL-MOS ecosystem.

## MVP status

This first commit establishes the dashboard UI in clearly labelled demo mode. It does not yet connect to live email or social providers and does not send messages or campaigns.

## Planned modules

- Unified inbox for Hostinger/IMAP-SMTP, Gmail, Microsoft Outlook, and future messaging/social adapters
- Shared contacts and communication timeline
- Campaigns, templates, and audience segmentation
- Connected channel health and integration settings
- Activity analytics and follow-up queue
- Workspace-aware permissions and audit trail

## Target architecture

- Next.js App Router + TypeScript
- Supabase Auth, PostgreSQL, Storage, Realtime, and Row Level Security
- Server-side provider adapters; OAuth tokens and mail credentials must never be exposed to the browser
- Provider webhooks/background jobs for sync and delivery status

## Run locally

Requires Node.js 22+.

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Safety and integration notes

- Demo records are sample data only.
- Never add service-role keys, mailbox passwords, OAuth secrets, or webhook secrets to client-side code or Git.
- Connect real providers only after server-side credential storage, tenant-scoped RLS, audit logging, and provider consent are implemented.
- Campaign delivery must include consent/suppression handling, unsubscribe management where required, and provider rate-limit controls.
