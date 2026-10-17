import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in to view connected mailboxes." }, { status: 401 });

  const { data, error } = await supabase.from("channel_accounts")
    .select("id,workspace_id,account_address,display_name,status,created_at,last_synced_at")
    .eq("provider", "hostinger")
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ ok: false, error: "Could not load connected mailboxes." }, { status: 500 });
  return NextResponse.json({ ok: true, accounts: data ?? [] });
}
