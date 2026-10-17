# Hostinger Email Setup — GL-MOS Communication Cloud

## What this version supports

- Authenticated workspace creation and membership
- Hostinger mailbox connection check using IMAP and SMTP
- Server-side AES-256-GCM encryption for mailbox credentials
- Read-only recent Inbox preview (up to 50 messages)
- No messages are sent, moved, deleted, or marked read by the preview endpoint

## 1. Configure environment variables

Copy `.env.local.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL`: the project's URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: publishable/anon key
- `SUPABASE_SERVICE_ROLE_KEY`: private service-role key; server-side only
- `EMAIL_CREDENTIALS_ENCRYPTION_KEY`: 64 hexadecimal characters (32 random bytes)

Generate the encryption key locally with Node.js:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep `.env.local` out of Git. Add the same environment values to the deployment provider's server environment. Never prefix the service-role key or encryption key with `NEXT_PUBLIC_`. Back up the encryption key securely: stored mailbox credentials cannot be decrypted if the key is lost.

## 2. Apply database migrations

Run the SQL files in `supabase/migrations/` in timestamp order in the Supabase SQL Editor, or use your established Supabase migration workflow:

1. `20261017000100_communication_cloud_core.sql`
2. `20261017000200_encrypted_channel_credentials.sql`

The second migration creates a credentials table with RLS enabled and no client-facing policies. Only trusted server code using the service-role key can read or write encrypted secrets.

## 3. Run locally

Use Node.js 22 or newer:

```powershell
npm install
npm run dev
```

Open `http://localhost:3000/login`, create/sign in to an account, then open `/setup` to create a workspace. After setting environment variables and applying migrations, open `/connect-email`.

## 4. Connect a mailbox

Enter the full mailbox address and mailbox password in the app itself (not in ChatGPT or GitHub). The initial version only permits these secure Hostinger defaults:

- IMAP: `imap.hostinger.com:993` (SSL/TLS)
- SMTP: `smtp.hostinger.com:465` (SSL/TLS)

The app verifies both protocols before saving credentials encrypted at rest. After success, the page requests a read-only Inbox preview.

## 5. Important limitations

- This is an initial adapter, not a production mail client. The dashboard's main conversation list still uses sample records until the live messages API is connected to its UI and normalized messages are persisted.
- The first version reads Inbox metadata only; it does not fetch message bodies or attachments and does not sync Sent, Drafts, or custom folders.
- Sending and bulk campaigns are not enabled. Delivery tracking, retry safeguards, consent/suppression lists, unsubscribe handling, provider webhooks, rate limits and audit events must be implemented before campaign sending.
- Configure Supabase Auth email confirmation and redirect URLs for local and deployed origins. Restrict sign-ups and workspace access according to the organization's policy before production.
- If your Supabase project uses custom grants, ensure the authenticated role can use the application tables through RLS and the service role can access the private credential table.
