import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { decryptCredentials } from "@/lib/email/credentials";
import { getRecentHostingerMessages, type HostingerCredentials } from "@/lib/email/hostinger";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Sign in to view mailbox messages." }, { status: 401 });

    const url = new URL(request.url);
    const accountId = url.searchParams.get("accountId");
    const limit = Number(url.searchParams.get("limit") ?? 25);
    if (!accountId) return NextResponse.json({ ok: false, error: "accountId is required." }, { status: 400 });

    const { data: account, error: accountError } = await sessionClient
      .from("channel_accounts")
      .select("id,workspace_id,account_address,display_name,status,provider")
      .eq("id", accountId).eq("provider", "hostinger").maybeSingle();
    if (accountError || !account) return NextResponse.json({ ok: false, error: "Mailbox not found or access denied." }, { status: 404 });

    const admin = createSupabaseAdminClient();
    const { data: secret, error: secretError } = await admin
      .from("channel_account_secrets")
      .select("ciphertext,iv_hex,auth_tag_hex,key_version")
      .eq("channel_account_id", account.id).maybeSingle();
    if (secretError || !secret) return NextResponse.json({ ok: false, error: "Mailbox credentials are not configured." }, { status: 409 });

    const credentials = decryptCredentials<HostingerCredentials>(secret);
    const messages = await getRecentHostingerMessages(credentials, limit);
    return NextResponse.json({
      ok: true,
      account: { id: account.id, email: account.account_address, status: account.status },
      messages,
      readOnly: true,
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Mailbox sync failed. Check the connection and server configuration." }, { status: 502 });
  }
}
