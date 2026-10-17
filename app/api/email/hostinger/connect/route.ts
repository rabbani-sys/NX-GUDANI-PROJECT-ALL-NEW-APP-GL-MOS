import { NextResponse } from "next/server";
import { createTransport } from "nodemailer";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { encryptCredentials } from "@/lib/email/credentials";
import { verifyHostingerMailbox, type HostingerCredentials } from "@/lib/email/hostinger";

export const runtime = "nodejs";

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(request: Request) {
  try {
    const sessionClient = await createSupabaseServerClient();
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return jsonError("Sign in before connecting a mailbox.", 401);

    const body = await request.json();
    const workspaceId = String(body.workspaceId ?? "");
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const imapHost = String(body.imapHost ?? "imap.hostinger.com").trim();
    const smtpHost = String(body.smtpHost ?? "smtp.hostinger.com").trim();
    const imapPort = Number(body.imapPort ?? 993);
    const smtpPort = Number(body.smtpPort ?? 465);

    if (!workspaceId || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !password) {
      return jsonError("Workspace, valid mailbox address and mailbox password are required.", 400);
    }
    if (!imapHost || !smtpHost || ![993, 143].includes(imapPort) || ![465, 587].includes(smtpPort)) {
      return jsonError("Use supported IMAP/SMTP host and port settings.", 400);
    }

    const { data: membership } = await sessionClient
      .from("workspace_members").select("role")
      .eq("workspace_id", workspaceId).eq("user_id", user.id).maybeSingle();
    if (!membership || !["owner", "admin"].includes(membership.role)) {
      return jsonError("Workspace owner or admin permission is required.", 403);
    }

    const credentials: HostingerCredentials = { email, password, imapHost, imapPort, smtpHost, smtpPort };
    try {
      await verifyHostingerMailbox(credentials);
    } catch {
      return jsonError("IMAP verification failed. Check the mailbox address, password, server and port.", 422);
    }

    const transporter = createTransport({
      host: smtpHost, port: smtpPort, secure: smtpPort === 465,
      auth: { user: email, pass: password }, connectionTimeout: 15000,
      greetingTimeout: 15000, socketTimeout: 20000,
    });
    try {
      await transporter.verify();
    } catch {
      return jsonError("IMAP works, but SMTP verification failed. Check the outgoing mail settings.", 422);
    } finally {
      transporter.close();
    }

    const admin = createSupabaseAdminClient();
    const { data: existing, error: lookupError } = await sessionClient
      .from("channel_accounts").select("id")
      .eq("workspace_id", workspaceId).eq("provider", "hostinger")
      .eq("account_address", email).maybeSingle();
    if (lookupError) return jsonError("Could not check existing channel account.", 500);

    let accountId: string;
    if (existing?.id) {
      const { error } = await sessionClient.from("channel_accounts").update({
        display_name: email, status: "connected",
        capabilities: { imap: true, smtp: true, folders: true, lastConnectionTest: new Date().toISOString() },
        last_error_code: null, updated_at: new Date().toISOString(),
      }).eq("id", existing.id);
      if (error) return jsonError("Could not update the channel account.", 500);
      accountId = existing.id;
    } else {
      const { data, error } = await sessionClient.from("channel_accounts").insert({
        workspace_id: workspaceId, provider: "hostinger", display_name: email,
        account_address: email, status: "connected",
        capabilities: { imap: true, smtp: true, folders: true, lastConnectionTest: new Date().toISOString() },
        created_by: user.id,
      }).select("id").single();
      if (error || !data) return jsonError("Could not create the channel account. Check workspace permissions.", 500);
      accountId = data.id;
    }

    const encrypted = encryptCredentials(credentials);
    const { error: secretError } = await admin.from("channel_account_secrets").upsert({
      channel_account_id: accountId, ...encrypted, updated_at: new Date().toISOString(),
    }, { onConflict: "channel_account_id" });
    if (secretError) {
      await sessionClient.from("channel_accounts").update({ status: "error" }).eq("id", accountId);
      return jsonError("Mailbox tested, but encrypted credentials could not be saved. Check the server configuration.", 500);
    }

    return NextResponse.json({ ok: true, account: { id: accountId, email, provider: "hostinger", status: "connected" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unexpected connection error.";
    if (message.includes("EMAIL_CREDENTIALS_ENCRYPTION_KEY") || message.includes("SUPABASE_SERVICE_ROLE_KEY")) {
      return jsonError("Server setup is incomplete. Configure the required private environment variables.", 503);
    }
    return jsonError("Could not connect mailbox. Review server configuration and try again.", 500);
  }
}
