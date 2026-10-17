"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setMessage(""); setError("");
    try {
      const supabase = createSupabaseBrowserClient();
      if (mode === "signup") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName.trim() } },
        });
        if (signUpError) throw signUpError;
        if (!data.session) {
          setMessage("Registration submitted. Check your email for the confirmation link, then return here to sign in.");
        } else {
          router.push("/setup");
          router.refresh();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        if (signInError) throw signInError;
        router.push("/setup");
        router.refresh();
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Authentication failed. Check your Supabase configuration.");
    } finally { setBusy(false); }
  }

  return <main className="auth-page">
    <div className="auth-brand"><div className="auth-brand-icon"><Mail size={23}/></div><div><strong>GL-MOS <span>COMMUNICATION</span></strong><small>COMMUNICATION CLOUD</small></div></div>
    <section className="auth-card">
      <div className="auth-eyebrow"><Sparkles size={14}/> ONE UNIFIED WORKSPACE</div>
      <h1>{mode === "signin" ? "Welcome back" : "Create your account"}</h1>
      <p className="auth-subtitle">Manage business email, contacts, campaigns and follow-ups from one secure workspace.</p>
      <div className="auth-tabs"><button className={mode === "signin" ? "active" : ""} onClick={() => {setMode("signin");setError("");setMessage("");}}>Sign in</button><button className={mode === "signup" ? "active" : ""} onClick={() => {setMode("signup");setError("");setMessage("");}}>Create account</button></div>
      <form onSubmit={submit} className="auth-form">
        {mode === "signup" && <label>Full name<input autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Your name" required minLength={2}/></label>}
        <label>Business email<input autoComplete="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" required/></label>
        <label>Password<input autoComplete={mode === "signin" ? "current-password" : "new-password"} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "signup" ? "At least 8 characters" : "Enter your password"} required minLength={8}/></label>
        {error && <div className="auth-alert error">{error}</div>}
        {message && <div className="auth-alert success">{message}</div>}
        <button className="auth-submit" type="submit" disabled={busy}>{busy ? "Please wait..." : mode === "signin" ? "Sign in securely" : "Create account"} <ArrowRight size={16}/></button>
      </form>
      <div className="auth-security"><ShieldCheck size={16}/><span>Provider credentials are encrypted server-side. Never share mailbox passwords in chat.</span></div>
    </section>
    <p className="auth-foot">GL-MOS Communication Cloud · Secure workspace access</p>
  </main>;
}
