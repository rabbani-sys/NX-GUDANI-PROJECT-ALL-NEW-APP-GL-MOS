"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, Plus, ShieldCheck } from "lucide-react";

type Workspace = { id: string; name: string; slug: string; role: string };

export default function SetupPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [name, setName] = useState("Rabbani Placement");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function loadWorkspaces() {
    setLoading(true); setError("");
    try {
      const response = await fetch("/api/workspaces", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to load workspaces.");
      setWorkspaces(data.workspaces ?? []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not load workspace.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadWorkspaces(); }, []);

  async function createWorkspace(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/workspaces", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Could not create workspace.");
      setWorkspaces((previous) => [...previous, data.workspace]);
      setNotice("Workspace created. Continue to the dashboard, then connect your first mailbox.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create workspace.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-brand"><div className="auth-brand-icon"><Building2 size={23}/></div><div><strong>GL-MOS <span>COMMUNICATION</span></strong><small>WORKSPACE SETUP</small></div></div>
    <section className="auth-card setup-card">
      <div className="auth-eyebrow"><ShieldCheck size={14}/> FIRST-TIME SETUP</div>
      <h1>Your business workspace</h1>
      <p className="auth-subtitle">Create one shared space for mailboxes, contacts, marketing campaigns and team follow-ups.</p>
      {loading ? <div className="setup-loading">Loading your workspaces…</div> : workspaces.length > 0 ? <div className="workspace-list">{workspaces.map((workspace) => <div className="workspace-option" key={workspace.id}><div className="workspace-option-icon"><Building2 size={18}/></div><div><strong>{workspace.name}</strong><span>{workspace.role} · {workspace.slug}</span></div><CheckCircle2 size={18}/></div>)}</div> : <div className="setup-empty">No workspace exists for this account yet. Create one below.</div>}
      <form onSubmit={createWorkspace} className="auth-form">
        <label>Workspace name<input value={name} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={100} required placeholder="Business or organization name"/></label>
        {error && <div className="auth-alert error">{error}</div>}
        {notice && <div className="auth-alert success">{notice}</div>}
        <button className="auth-submit" type="submit" disabled={busy || loading}><Plus size={16}/>{busy ? "Creating workspace..." : "Create workspace"}</button>
      </form>
      <button className="setup-continue" onClick={() => router.push("/")}>Continue to dashboard <ArrowRight size={15}/></button>
    </section>
    <p className="auth-foot">Workspace data is separated by membership and database access policies.</p>
  </main>;
}
