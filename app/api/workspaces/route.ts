import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ ok: false, error: "Sign in first." }, { status: 401 });

  const { data: memberships, error: membershipError } = await supabase
    .from("workspace_members").select("workspace_id,role").eq("user_id", user.id);
  if (membershipError) return NextResponse.json({ ok: false, error: "Could not load workspace memberships." }, { status: 500 });
  const ids = (memberships ?? []).map((item) => item.workspace_id);
  if (ids.length === 0) return NextResponse.json({ ok: true, workspaces: [] });

  const { data: workspaces, error } = await supabase
    .from("workspaces").select("id,name,slug,created_at").in("id", ids);
  if (error) return NextResponse.json({ ok: false, error: "Could not load workspaces." }, { status: 500 });

  return NextResponse.json({
    ok: true,
    workspaces: (workspaces ?? []).map((workspace) => ({
      ...workspace,
      role: memberships?.find((item) => item.workspace_id === workspace.id)?.role ?? "member",
    })),
  });
}

export async function POST(request: Request) {
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false, error: "Sign in before creating a workspace." }, { status: 401 });

    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ ok: false, error: "Workspace name must be 2–100 characters." }, { status: 400 });
    }

    const slugBase = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 45) || "workspace";
    const slug = `${slugBase}-${randomUUID().slice(0, 8)}`;
    const { data: workspace, error: createError } = await supabase.from("workspaces")
      .insert({ name, slug, created_by: user.id }).select("id,name,slug,created_at").single();
    if (createError || !workspace) {
      return NextResponse.json({ ok: false, error: "Workspace could not be created. Verify the database migration is applied." }, { status: 500 });
    }

    const { error: membershipError } = await supabase.from("workspace_members")
      .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });
    if (membershipError) {
      await supabase.from("workspaces").delete().eq("id", workspace.id);
      return NextResponse.json({ ok: false, error: "Workspace was created but owner membership failed. Review the RLS policies." }, { status: 500 });
    }

    return NextResponse.json({ ok: true, workspace: { ...workspace, role: "owner" } }, { status: 201 });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not create workspace." }, { status: 500 });
  }
}
