"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Inbox, LockKeyhole, Mail, RefreshCw, ShieldCheck, Unplug } from "lucide-react";

type Workspace = { id: string; name: string; role: string };
type Account = { id: string; workspace_id: string; account_address: string; display_name: string; status: string };
type MailRow = { uid: number; subject: string; fromName: string; fromAddress: string; date: string | null; unread: boolean };

export default function ConnectEmailPage() {
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [workspaceId, setWorkspaceId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [imapHost, setImapHost] = useState("imap.hostinger.com");
  const [smtpHost, setSmtpHost] = useState("smtp.hostinger.com");
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [messages, setMessages] = useState<MailRow[]>([]);
  const [previewAccount, setPreviewAccount] = useState("");

  async function load() {
    setLoading(true); setError("");
    try {
      const [workspacesResponse, accountsResponse] = await Promise.all([
        fetch("/api/workspaces", { cache: "no-store" }),
        fetch("/api/email/hostinger/accounts", { cache: "no-store" }),
      ]);
      const workspaceData = await workspacesResponse.json();
      const accountData = await accountsResponse.json();
      if (!workspacesResponse.ok) throw new Error(workspaceData.error ?? "Please sign in before connecting email.");
      if (!accountsResponse.ok) throw new Error(accountData.error ?? "Could not load connected mailboxes.");
      const available = (workspaceData.workspaces ?? []) as Workspace[];
      setWorkspaces(available);
      setAccounts(accountData.accounts ?? []);
      if (!workspaceId && available.length) setWorkspaceId(available[0].id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to load account settings.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function connect(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice(""); setMessages([]);
    try {
      const response = await fetch("/api/email/hostinger/connect", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, email, password, imapHost, smtpHost, imapPort: 993, smtpPort: 465 }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Mailbox connection failed.");
      setPassword("");
      setNotice(`Mailbox ${data.account.email} connected. Credentials were encrypted before being stored.`);
      await load();
      setPreviewAccount(data.account.id);
      await preview(data.account.id);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Mailbox connection failed.");
    } finally { setBusy(false); }
  }

  async function preview(accountId: string) {
    setPreviewAccount(accountId); setError(""); setNotice("");
    try {
      const response = await fetch(`/api/email/hostinger/messages?accountId=${encodeURIComponent(accountId)}&limit=20`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Inbox preview failed.");
      setMessages(data.messages ?? []);
      setNotice(`Read-only inbox preview loaded: ${(data.messages ?? []).length} messages. No messages were changed or sent.`);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Inbox preview failed.");
    }
  }

  return <main className="connect-page">
    <header className="connect-topbar"><button className="connect-back" onClick={() => router.push("/")}><ArrowLeft size={16}/> Dashboard</button><div className="auth-brand compact"><div className="auth-brand-icon"><Mail size={20}/></div><div><strong>GL-MOS <span>COMMUNICATION</span></strong><small>MAILBOX CONNECTION</small></div></div></header>
    <div className="connect-content">
      <div className="connect-intro"><div className="auth-eyebrow"><ShieldCheck size={14}/> SECURE EMAIL INTEGRATION</div><h1>Connect Hostinger Email</h1><p>Connect a mailbox to your unified inbox. The app verifies incoming and outgoing server access, encrypts credentials server-side and starts with a read-only inbox preview.</p></div>
      {error && <div className="auth-alert error connect-alert">{error}</div>}
      {notice && <div className="auth-alert success connect-alert">{notice}</div>}
      <div className="connect-grid">
        <section className="connect-card">
          <div className="connect-card-title"><div className="connect-card-icon"><Mail size={19}/></div><div><h2>Mailbox details</h2><p>Use your mailbox login, not your hosting control-panel login.</p></div></div>
          {loading ? <div className="setup-loading">Loading workspace settings…</div> : workspaces.length === 0 ? <div className="connect-empty">No workspace found. <button onClick={() => router.push("/setup")}>Create workspace <ArrowRight size={13}/></button></div> : <form onSubmit={connect} className="auth-form connect-form">
            <label>Workspace<select value={workspaceId} onChange={(e) => setWorkspaceId(e.target.value)} required>{workspaces.map((w) => <option value={w.id} key={w.id}>{w.name} ({w.role})</option>)}</select></label>
            <label>Mailbox address<input type="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@yourdomain.com" required/></label>
            <label>Mailbox password<div className="password-input"><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter mailbox password" required/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div></label>
            <button type="button" className="advanced-toggle" onClick={() => setAdvanced(!advanced)}>{advanced ? "Hide server settings" : "Advanced server settings"} <ArrowRight size={13}/></button>
            {advanced && <div className="advanced-fields"><label>IMAP host<input value={imapHost} readOnly required/></label><div className="fixed-port-row"><span>IMAP port</span><strong>993 · SSL/TLS</strong></div><label>SMTP host<input value={smtpHost} readOnly required/></label><div className="fixed-port-row"><span>SMTP port</span><strong>465 · SSL/TLS</strong></div><small className="server-note">Custom mail hosts are disabled in this version to protect the server from unsafe network requests.</small></div>}
            <button className="auth-submit" type="submit" disabled={busy || loading || !workspaceId}><LockKeyhole size={15}/>{busy ? "Testing connection…" : "Verify and connect mailbox"} <ArrowRight size={15}/></button>
          </form>}
          <div className="connect-security"><ShieldCheck size={17}/><div><strong>Credential protection</strong><span>Password is sent over HTTPS to the server, tested, then encrypted using AES-256-GCM. It is never returned to the browser or saved in local storage.</span></div></div>
        </section>
        <section className="connect-card connected-card">
          <div className="connect-card-title"><div className="connect-card-icon green-icon"><Inbox size={19}/></div><div><h2>Connected mailboxes</h2><p>Open a read-only inbox preview.</p></div><button className="icon-button" aria-label="Refresh connected mailboxes" onClick={() => void load()}><RefreshCw size={16}/></button></div>
          {accounts.length === 0 ? <div className="connected-empty"><Unplug size={24}/><strong>No mailboxes connected yet</strong><span>Connect your first Hostinger mailbox to see recent messages here.</span></div> : <div className="connected-list">{accounts.map((account) => <div className="connected-account" key={account.id}><div className="connected-account-icon"><Mail size={16}/></div><div className="connected-account-info"><strong>{account.account_address}</strong><span>{account.status === "connected" ? "Connection verified" : account.status}</span></div><button className="button button-secondary small" onClick={() => void preview(account.id)}>View inbox <ArrowRight size={13}/></button></div>)}</div>}
          {messages.length > 0 && <div className="mail-preview"><div className="mail-preview-heading"><strong>Inbox preview</strong><span>Read only · latest {messages.length}</span></div>{messages.map((m) => <div className={`mail-preview-row ${m.unread ? "is-unread" : ""}`} key={m.uid}><div className="mail-preview-avatar">{(m.fromName || m.fromAddress || "?").slice(0,1).toUpperCase()}</div><div className="mail-preview-main"><strong>{m.fromName || m.fromAddress || "Unknown sender"}</strong><span>{m.subject}</span><small>{m.fromAddress}</small></div><time>{m.date ? new Date(m.date).toLocaleDateString() : ""}</time></div>)}</div>}
        </section>
      </div>
      <div className="connect-footnote"><ShieldCheck size={15}/> Connecting a mailbox does not send messages, move folders or change read/unread status. Bulk campaigns are not enabled.</div>
    </div>
  </main>;
}
