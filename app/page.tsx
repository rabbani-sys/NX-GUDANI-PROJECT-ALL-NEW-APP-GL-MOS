"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity, Archive, ArrowDownLeft, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarClock, Check, ChevronDown, ContactRound, FileText, Filter, Inbox,
  Instagram, LayoutDashboard, Mail, Megaphone, MessageCircle, MoreHorizontal,
  Plus, Search, Send, Settings, ShieldCheck, Sparkles, Users, X, Youtube, Zap,
  Menu, Paperclip, Clock3, Star, AlertTriangle, Globe2, BarChart3, Layers3,
  Linkedin, MessageSquareText
} from "lucide-react";

type Channel = "Email" | "WhatsApp" | "Instagram" | "LinkedIn" | "Telegram";
type Message = {
  id: number; name: string; address: string; subject: string; preview: string;
  time: string; channel: Channel; category: string; unread: boolean; color: string;
  initials: string; starred?: boolean; priority?: boolean;
};

const seedMessages: Message[] = [
  { id: 1, name: "Marta Kovac", address: "marta.kovac@example.com", subject: "Re: Serbia hospitality vacancies", preview: "Thank you for the details. Please share the updated candidate shortlist and interview slots.", time: "09:42", channel: "Email", category: "Employer Recruitment", unread: true, color: "lavender", initials: "MK", starred: true, priority: true },
  { id: 2, name: "Delivery Status Notification", address: "mailer-daemon@example.net", subject: "Delivery failed: candidate outreach", preview: "The remote server returned a rate-limit response. Review delivery status before retrying.", time: "09:18", channel: "Email", category: "Delivery Failures", unread: true, color: "peach", initials: "DS", priority: true },
  { id: 3, name: "Ayesha Rahman", address: "ayesha@example.com", subject: "Candidate profile — customer service", preview: "Please find my updated CV and supporting documents attached for your review.", time: "08:56", channel: "Email", category: "Candidate Profiles", unread: true, color: "mint", initials: "AR" },
  { id: 4, name: "Global Talent Partners", address: "recruitment@example.org", subject: "New manpower requirement", preview: "We have an opening for 12 hospitality staff. Could you confirm availability and process?", time: "Yesterday", channel: "Email", category: "Employer Recruitment", unread: false, color: "blue", initials: "GT" },
  { id: 5, name: "Nadia Khan", address: "nadia@example.com", subject: "Refund status follow-up", preview: "Could you please share a written update on the expected settlement date?", time: "Yesterday", channel: "Email", category: "Candidate Refunds", unread: false, color: "rose", initials: "NK", priority: true },
  { id: 6, name: "Rabbani Placement", address: "company account", subject: "Campaign draft: Europe Career Week", preview: "Draft campaign prepared for the Europe career programme audience. Review before sending.", time: "Mon", channel: "Email", category: "Campaigns", unread: false, color: "gold", initials: "RP" },
  { id: 7, name: "Daniel — Employer Relations", address: "@daniel_er", subject: "Interview slots confirmed", preview: "The employer has confirmed three interview windows for next week.", time: "Mon", channel: "WhatsApp", category: "Interviews", unread: false, color: "mint", initials: "DE" },
  { id: 8, name: "Study Abroad Desk", address: "@studyabroad_desk", subject: "Student enquiry: Germany", preview: "A new enquiry came in about the next intake and document checklist.", time: "Sun", channel: "Instagram", category: "Leads", unread: false, color: "peach", initials: "SA" },
];

const navGroups = [
  { label: "WORKSPACE", items: [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "inbox", label: "Unified inbox", icon: Inbox, count: "12" },
    { id: "contacts", label: "Contacts & CRM", icon: ContactRound },
    { id: "tasks", label: "Tasks & follow-ups", icon: CalendarClock, count: "4" },
  ]},
  { label: "GROWTH", items: [
    { id: "campaigns", label: "Campaigns", icon: Megaphone },
    { id: "templates", label: "Templates", icon: FileText },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ]},
  { label: "ADMIN", items: [
    { id: "channels", label: "Connected channels", icon: Layers3 },
    { id: "settings", label: "Settings", icon: Settings },
  ]},
];

const channelMeta: Record<Channel, { label: string; color: string }> = {
  Email: { label: "Email", color: "email" },
  WhatsApp: { label: "WhatsApp", color: "whatsapp" },
  Instagram: { label: "Instagram", color: "instagram" },
  LinkedIn: { label: "LinkedIn", color: "linkedin" },
  Telegram: { label: "Telegram", color: "telegram" },
};

export default function Home() {
  const [section, setSection] = useState("inbox");
  const [folder, setFolder] = useState("All messages");
  const [query, setQuery] = useState("");
  const [channelFilter, setChannelFilter] = useState("All channels");
  const [selectedId, setSelectedId] = useState(1);
  const [messages, setMessages] = useState(seedMessages);
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [notice, setNotice] = useState("");
  const [mobileNav, setMobileNav] = useState(false);

  const filtered = useMemo(() => messages.filter((m) => {
    const text = (m.name + " " + m.address + " " + m.subject + " " + m.preview + " " + m.category).toLowerCase();
    const matchesQuery = text.includes(query.toLowerCase());
    const matchesFolder = folder === "All messages" || (folder === "Unread" ? m.unread : folder === "Starred" ? m.starred : m.category === folder);
    const matchesChannel = channelFilter === "All channels" || m.channel === channelFilter;
    return matchesQuery && matchesFolder && matchesChannel;
  }), [messages, query, folder, channelFilter]);

  const selected = messages.find((m) => m.id === selectedId) ?? filtered[0];
  const unreadCount = messages.filter((m) => m.unread).length;
  const setActive = (id: string) => { setSection(id); setMobileNav(false); setNotice(""); };

  function markRead(id: number) {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, unread: false } : m));
  }
  function toggleStar(id: number) {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, starred: !m.starred } : m));
  }
  function archiveMessage(id: number) {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    setNotice("Conversation archived in this demo view.");
  }
  function saveDraft() {
    setNotice("Draft saved in this demo session. Connect a mail provider to persist drafts.");
    setShowCompose(false); setComposeTo(""); setComposeSubject(""); setComposeBody("");
  }

  const pageTitles: Record<string, string> = {
    overview: "Good morning, Rabbani", inbox: "Unified inbox", contacts: "Contacts & CRM",
    tasks: "Tasks & follow-ups", campaigns: "Campaign studio", templates: "Message templates",
    analytics: "Communication analytics", channels: "Connected channels", settings: "Workspace settings",
  };

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNav ? "sidebar-open" : ""}`}>
        <div className="brand-row">
          <div className="brand-mark"><MessageSquareText size={22} strokeWidth={2.4} /></div>
          <div><div className="brand-name">GL-MOS <span>COMMUNICATION</span></div><div className="brand-sub">COMMUNICATION CLOUD</div></div>
          <button className="icon-button sidebar-close" aria-label="Close navigation" onClick={() => setMobileNav(false)}><X size={18}/></button>
        </div>
        <button className="workspace-switch" onClick={() => setNotice("Workspace switching will be connected to your GL-MOS organization settings.")}>
          <div className="workspace-avatar">RP</div><div className="workspace-copy"><strong>Rabbani Placement</strong><span>Business workspace</span></div><ChevronDown size={16} />
        </button>
        <div className="sidebar-scroll">
          {navGroups.map((group) => <div className="nav-group" key={group.label}>
            <div className="nav-heading">{group.label}</div>
            {group.items.map((item) => { const Icon = item.icon; return <button key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`} onClick={() => setActive(item.id)}>
              <Icon size={18} strokeWidth={1.8}/><span>{item.label}</span>{item.count && <span className="nav-count">{item.count}</span>}
            </button>; })}
          </div>)}
          <div className="sidebar-divider" />
          <div className="nav-heading">QUICK FOLDERS</div>
          {[
            { label: "All messages", icon: Inbox, count: String(messages.length) },
            { label: "Unread", icon: Mail, count: String(unreadCount) },
            { label: "Starred", icon: Star, count: "" },
            { label: "Employer Recruitment", icon: BriefcaseBusiness, count: "" },
            { label: "Candidate Profiles", icon: Users, count: "" },
            { label: "Delivery Failures", icon: AlertTriangle, count: "" },
            { label: "Candidate Refunds", icon: Archive, count: "" },
          ].map((item) => { const Icon = item.icon; return <button key={item.label} className={`nav-item folder-item ${section === "inbox" && folder === item.label ? "active" : ""}`} onClick={() => {setActive("inbox");setFolder(item.label);}}>
            <Icon size={17} strokeWidth={1.8}/><span>{item.label}</span>{item.count && <span className="folder-count">{item.count}</span>}
          </button>; })}
        </div>
        <div className="sidebar-bottom">
          <div className="plan-card"><div className="plan-icon"><Zap size={16}/></div><div><strong>Communication OS</strong><span>Demo workspace · Phase 1</span></div></div>
          <button className="profile-row" onClick={() => setActive("settings")}><div className="profile-avatar">MR</div><div className="profile-copy"><strong>Workspace Admin</strong><span>Admin access</span></div><MoreHorizontal size={18}/></button>
        </div>
      </aside>

      {mobileNav && <button className="mobile-overlay" aria-label="Close navigation overlay" onClick={() => setMobileNav(false)} />}

      <section className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20}/></button><div className="breadcrumbs">GL-MOS <span>/</span> Communication Cloud <span>/</span> <strong>{pageTitles[section]}</strong></div></div>
          <div className="topbar-actions"><div className="demo-pill"><span className="pulse-dot" /> DEMO MODE</div><button className="icon-button notification-button" aria-label="Notifications" onClick={() => setNotice("You are all caught up in this demo workspace.")}><Bell size={18}/><i /></button><div className="top-avatar">MR</div></div>
        </header>

        <div className="page-content">
          <div className="page-header">
            <div><div className="eyebrow"><Sparkles size={14}/> YOUR COMMUNICATION WORKSPACE</div><h1>{pageTitles[section]}</h1><p>{section === "inbox" ? "Every conversation, account and follow-up in one connected place." : "A shared workspace for customer conversations, campaigns and team follow-through."}</p></div>
            <div className="header-actions"><button className="button button-secondary" onClick={() => setNotice("Provider connections will be enabled after secure OAuth and server-side adapters are configured.")}><Plus size={16}/> Connect channel</button><button className="button button-primary" onClick={() => setShowCompose(true)}><Send size={16}/> Compose</button></div>
          </div>

          {notice && <div className="notice"><div><Check size={16}/>{notice}</div><button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={16}/></button></div>}

          {section === "inbox" ? <>
            <div className="metrics-grid">
              <div className="metric-card"><div className="metric-top"><span>Open conversations</span><span className="metric-icon purple"><Inbox size={17}/></span></div><div className="metric-value">128</div><div className="metric-foot"><span className="trend-up"><ArrowUpRight size={14}/> 8.4%</span> vs. last week</div></div>
              <div className="metric-card"><div className="metric-top"><span>Needs your reply</span><span className="metric-icon amber"><Clock3 size={17}/></span></div><div className="metric-value">24</div><div className="metric-foot"><span className="metric-neutral">6 high priority</span></div></div>
              <div className="metric-card"><div className="metric-top"><span>New contacts</span><span className="metric-icon green"><Users size={17}/></span></div><div className="metric-value">36</div><div className="metric-foot"><span className="trend-up"><ArrowUpRight size={14}/> 12.1%</span> this month</div></div>
              <div className="metric-card"><div className="metric-top"><span>Delivery alerts</span><span className="metric-icon red"><Activity size={17}/></span></div><div className="metric-value">9</div><div className="metric-foot"><span className="metric-warning"><AlertTriangle size={13}/> Review before retry</span></div></div>
            </div>

            <div className="inbox-layout">
              <section className="conversation-panel">
                <div className="panel-heading"><div><h2>Messages</h2><span className="panel-sub">{filtered.length} conversations in view</span></div><button className="icon-button" aria-label="More message options" onClick={() => setNotice("Bulk actions will be enabled after provider sync is connected.")}><MoreHorizontal size={19}/></button></div>
                <div className="inbox-tools"><div className="search-box"><Search size={16}/><input aria-label="Search messages" placeholder="Search conversations..." value={query} onChange={(e) => setQuery(e.target.value)}/>{query && <button aria-label="Clear search" onClick={() => setQuery("")}><X size={14}/></button>}</div><button className="filter-button" onClick={() => setChannelFilter(channelFilter === "All channels" ? "Email" : channelFilter === "Email" ? "WhatsApp" : channelFilter === "WhatsApp" ? "Instagram" : "All channels")}><Filter size={15}/><span>{channelFilter}</span><ChevronDown size={14}/></button></div>
                <div className="message-list">
                  {filtered.map((m) => <button key={m.id} className={`message-row ${selected?.id === m.id ? "selected" : ""} ${m.unread ? "unread" : ""}`} onClick={() => {setSelectedId(m.id);markRead(m.id);}}>
                    <div className={`contact-avatar ${m.color}`}>{m.initials}</div><div className="message-main"><div className="message-line"><strong>{m.name}</strong><time>{m.time}</time></div><div className="message-subject">{m.subject}</div><div className="message-preview">{m.preview}</div><div className="message-tags"><span className={`channel-chip ${channelMeta[m.channel].color}`}>{m.channel === "Email" ? <Mail size={11}/> : m.channel === "WhatsApp" ? <MessageCircle size={11}/> : m.channel === "Instagram" ? <Instagram size={11}/> : <Globe2 size={11}/>} {m.channel}</span><span className="category-chip">{m.category}</span>{m.priority && <span className="priority-dot" title="Priority" />}</div></div>
                    <div className="row-trailing">{m.starred && <Star size={14} className="star-filled" fill="currentColor"/>}{m.unread && <span className="unread-dot"/>}</div>
                  </button>)}
                  {filtered.length === 0 && <div className="empty-state"><Inbox size={25}/><strong>No conversations found</strong><span>Try another search or folder.</span><button onClick={() => {setQuery("");setFolder("All messages");setChannelFilter("All channels");}}>Clear filters</button></div>}
                </div>
                <div className="list-footer"><span>Showing {filtered.length} demo records</span><button onClick={() => setNotice("Connect a provider to sync real mailbox messages.")}>Sync inbox <ArrowDownLeft size={14}/></button></div>
              </section>

              <section className="detail-panel">
                {selected ? <>
                  <div className="detail-toolbar"><div className="detail-toolbar-left"><span className="status-badge"><span/> Open</span><span className="detail-channel">{selected.channel} conversation</span></div><div className="detail-toolbar-actions"><button className="icon-button" title="Star conversation" onClick={() => toggleStar(selected.id)}><Star size={17} className={selected.starred ? "star-filled" : ""} fill={selected.starred ? "currentColor" : "none"}/></button><button className="icon-button" title="Archive conversation" onClick={() => archiveMessage(selected.id)}><Archive size={17}/></button><button className="icon-button" title="More actions" onClick={() => setNotice("More conversation actions will be connected to the provider adapter.")}><MoreHorizontal size={18}/></button></div></div>
                  <div className="thread-header"><div className={`contact-avatar large ${selected.color}`}>{selected.initials}</div><div className="thread-person"><h2>{selected.name}</h2><span>{selected.address}</span><div className="thread-tags"><span className={`channel-chip ${channelMeta[selected.channel].color}`}>{selected.channel}</span><span className="category-chip">{selected.category}</span></div></div></div>
                  <div className="thread-divider"><span>TODAY · {selected.time}</span></div>
                  <div className="email-card"><div className="email-card-head"><div><strong>{selected.subject}</strong><span>To: Rabbani Placement · Inbox</span></div><button className="icon-button" aria-label="More email options" onClick={() => setNotice("Message options are available after connecting the real provider.")}><MoreHorizontal size={17}/></button></div><div className="email-body"><p>Hello team,</p><p>{selected.preview}</p><p>Please let me know if any additional information is required. I look forward to your update.</p><p>Best regards,<br/>{selected.name}</p></div><div className="email-card-foot"><span><Paperclip size={14}/> No attachments in demo</span><button onClick={() => setNotice("Original message content is sample data. Connect the provider to view real content.")}>View original <ArrowUpRight size={13}/></button></div></div>
                  <div className="ai-insight"><div className="ai-insight-icon"><Sparkles size={17}/></div><div><strong>Communication assistant</strong><p>Suggested next step: review the message, confirm the owner and set a follow-up date. AI summaries are not connected in demo mode.</p><button onClick={() => setActive("tasks")}>Create follow-up <ArrowUpRight size={13}/></button></div></div>
                  <div className="reply-box"><div className="reply-box-top"><span>Quick reply</span><span className="reply-disabled">Demo only</span></div><textarea placeholder="Connect this channel to reply to real messages..." disabled/><div className="reply-box-foot"><span>Replies are disabled until a provider is connected.</span><button className="button button-primary" disabled><Send size={14}/> Send reply</button></div></div>
                </> : <div className="empty-state"><Inbox size={24}/><strong>Select a conversation</strong></div>}
              </section>
            </div>
          </> : <ModuleView section={section} onCompose={() => setShowCompose(true)} onNotice={setNotice} onSection={setActive} />}

          <footer className="page-footer"><span><ShieldCheck size={14}/> Workspace protected · Demo data only</span><span>GL-MOS Communication Cloud <b>•</b> Phase 1 MVP</span></footer>
        </div>
      </section>

      {showCompose && <div className="modal-backdrop" role="presentation" onMouseDown={(e) => {if (e.target === e.currentTarget) setShowCompose(false);}}><section className="compose-modal" role="dialog" aria-modal="true" aria-labelledby="compose-title"><div className="compose-header"><div><div className="eyebrow"><Send size={13}/> NEW MESSAGE</div><h2 id="compose-title">Compose message</h2></div><button className="icon-button" aria-label="Close compose" onClick={() => setShowCompose(false)}><X size={18}/></button></div><div className="compose-notice"><AlertTriangle size={15}/> Demo mode — saving creates a local draft notice only. No email will be sent.</div><label>From channel<select defaultValue="Email"><option>Email</option><option>WhatsApp (future connection)</option><option>LinkedIn (future connection)</option></select></label><label>To<input value={composeTo} onChange={(e) => setComposeTo(e.target.value)} placeholder="Recipient email or contact"/></label><label>Subject<input value={composeSubject} onChange={(e) => setComposeSubject(e.target.value)} placeholder="Subject line"/></label><label>Message<textarea value={composeBody} onChange={(e) => setComposeBody(e.target.value)} placeholder="Write your message..." rows={5}/></label><div className="compose-footer"><button className="button button-secondary" onClick={() => setShowCompose(false)}>Cancel</button><button className="button button-primary" onClick={saveDraft}><FileText size={15}/> Save demo draft</button></div></section></div>}
    </main>
  );
}

function ModuleView({ section, onCompose, onNotice, onSection }: { section: string; onCompose: () => void; onNotice: (message: string) => void; onSection: (id: string) => void }) {
  const router = useRouter();
  if (section === "overview") return <div className="module-grid"><div className="wide-card welcome-card"><div className="eyebrow"><Sparkles size={14}/> COMMUNICATION AT A GLANCE</div><h2>One contact. Every channel.</h2><p>Bring email, messaging, CRM and campaign workflows into one secure workspace.</p><div className="welcome-actions"><button className="button button-primary" onClick={() => onSection("inbox")}>Open unified inbox <Inbox size={15}/></button><button className="button button-secondary" onClick={() => onSection("channels")}>Connect channels <Plus size={15}/></button></div><div className="welcome-orb orb-one"/><div className="welcome-orb orb-two"/></div><div className="module-card"><div className="module-card-icon purple"><Inbox size={18}/></div><span>UNIFIED INBOX</span><strong>128</strong><small>Open conversations · sample</small><button onClick={() => onSection("inbox")}>View inbox <ArrowUpRight size={13}/></button></div><div className="module-card"><div className="module-card-icon green"><Users size={18}/></div><span>CONTACTS</span><strong>2,486</strong><small>Across connected identities · sample</small><button onClick={() => onSection("contacts")}>Open contacts <ArrowUpRight size={13}/></button></div><div className="wide-card channel-health"><div className="panel-heading"><div><h2>Channel health</h2><span className="panel-sub">Provider connections are not configured yet</span></div><button className="text-link" onClick={() => onSection("channels")}>Manage <ArrowUpRight size={13}/></button></div><div className="channel-health-grid">{["Hostinger Email","Gmail / Google","Outlook","WhatsApp Business","Instagram","LinkedIn"].map((n) => <div className="channel-health-item" key={n}><span className="health-circle"><Layers3 size={15}/></span><div><strong>{n}</strong><small>Not connected</small></div><span className="disconnected-dot"/></div>)}</div></div><div className="wide-card followup-card"><div className="panel-heading"><div><h2>Needs attention</h2><span className="panel-sub">Suggested priorities from demo data</span></div><button className="text-link" onClick={() => onSection("tasks")}>See tasks <ArrowUpRight size={13}/></button></div>{[["Review delivery failure alerts","Before retrying campaign messages","red"],["Reply to employer vacancy request","Recruitment · Today","purple"],["Confirm candidate refund update","Candidate support · Today","amber"]].map((a) => <div className="followup-row" key={a[0]}><span className={`followup-mark ${a[2]}`}/><div><strong>{a[0]}</strong><small>{a[1]}</small></div><button className="icon-button" onClick={() => onNotice("Follow-up marked for review in this demo.")}><Check size={15}/></button></div>)}</div></div>;

  if (section === "contacts") return <div className="module-stack"><div className="module-toolbar"><div className="search-box"><Search size={16}/><input placeholder="Search contacts (demo)" onChange={() => {}}/></div><button className="button button-primary" onClick={() => onNotice("Contact creation will be backed by the shared CRM database in the next phase.")}><Plus size={15}/> Add contact</button></div><div className="data-card"><div className="panel-heading"><div><h2>Shared contact directory</h2><span className="panel-sub">Sample records · one identity across multiple channels</span></div><button className="filter-button"><Filter size={14}/> Filters</button></div><table><thead><tr><th>CONTACT</th><th>TYPE</th><th>CHANNELS</th><th>LAST ACTIVITY</th><th>STATUS</th></tr></thead><tbody>{[["Marta Kovac","Employer","Email · LinkedIn","Today, 09:42","Active"],["Ayesha Rahman","Candidate","Email · WhatsApp","Today, 08:56","New"],["Global Talent Partners","Recruiter","Email · LinkedIn","Yesterday","Active"],["Nadia Khan","Candidate","Email · WhatsApp","Yesterday","Follow-up"],["Study Abroad Desk","Partner","Instagram · Email","Sunday","Active"]].map((row) => <tr key={row[0]}><td><div className="table-contact"><span>{row[0].split(" ").map(s=>s[0]).join("").slice(0,2)}</span><strong>{row[0]}</strong></div></td><td>{row[1]}</td><td>{row[2]}</td><td>{row[3]}</td><td><span className={`table-status ${row[4].toLowerCase()}`}>{row[4]}</span></td></tr>)}</tbody></table></div><div className="info-banner"><ShieldCheck size={17}/><div><strong>Shared identity model</strong><p>Contacts, email identities, channel handles, conversations and tasks will be stored as related records in Supabase with workspace-level access controls.</p></div></div></div>;

  if (section === "campaigns" || section === "templates") return <div className="module-stack"><div className="campaign-hero"><div className="campaign-icon"><Megaphone size={23}/></div><div><div className="eyebrow">CAMPAIGN WORKSPACE</div><h2>{section === "campaigns" ? "Reach the right audience, responsibly." : "Keep every message on-brand."}</h2><p>{section === "campaigns" ? "Build segmented email and messaging campaigns, review content and monitor delivery in one place." : "Create reusable responses for candidates, employers, partners and service enquiries."}</p></div><button className="button button-primary" onClick={onCompose}><Plus size={15}/>{section === "campaigns" ? "New campaign" : "Create template"}</button></div><div className="metrics-grid three"><div className="metric-card"><div className="metric-top"><span>{section === "campaigns" ? "Draft campaigns" : "Saved templates"}</span><span className="metric-icon purple"><FileText size={16}/></span></div><div className="metric-value">3</div><div className="metric-foot">Demo records</div></div><div className="metric-card"><div className="metric-top"><span>Audience segments</span><span className="metric-icon green"><Users size={16}/></span></div><div className="metric-value">8</div><div className="metric-foot">Candidates, employers and partners</div></div><div className="metric-card"><div className="metric-top"><span>Delivery alerts</span><span className="metric-icon red"><Activity size={16}/></span></div><div className="metric-value">9</div><div className="metric-foot"><span className="metric-warning">Resolve before sending</span></div></div></div><div className="data-card"><div className="panel-heading"><div><h2>{section === "campaigns" ? "Campaign drafts" : "Message templates"}</h2><span className="panel-sub">Demo content only · nothing will be sent</span></div></div>{(section === "campaigns" ? [["Europe Career Week","Candidate leads · 420 contacts","Draft"],["Employer re-engagement","Employer segment · 86 contacts","Needs review"],["Study abroad enquiry follow-up","Study abroad leads · 125 contacts","Draft"]] : [["Candidate enquiry acknowledgement","Candidate support · Email","Ready to customize"],["Employer vacancy follow-up","Employer recruitment · Email","Ready to customize"],["Interview reminder","Interview bookings · Email / WhatsApp","Ready to customize"]]).map((row) => <div className="campaign-row" key={row[0]}><div className="campaign-row-icon"><FileText size={18}/></div><div className="campaign-row-main"><strong>{row[0]}</strong><span>{row[1]}</span></div><span className="category-chip">{row[2]}</span><button className="icon-button" onClick={() => onNotice("Open/edit actions will be connected to persisted campaign records.")}><MoreHorizontal size={17}/></button></div>)}</div><div className="info-banner amber-banner"><AlertTriangle size={17}/><div><strong>Sending is intentionally disabled</strong><p>Before enabling campaigns, implement consent and suppression lists, unsubscribe handling, delivery logs, rate limits and provider-specific sending policies. Your previous mailbox rate-limit alerts should be reviewed first.</p></div></div></div>;

  if (section === "channels") return <div className="module-stack"><div className="info-banner"><ShieldCheck size={17}/><div><strong>Secure connection model</strong><p>Provider access will be authorized per workspace. Secrets remain server-side; this dashboard does not request or store passwords in the browser.</p></div></div><div className="channel-grid">{[{name:"Hostinger Email",desc:"Existing business mailboxes via supported IMAP/SMTP adapter",icon:Mail,tag:"Email"},{name:"Gmail / Google Workspace",desc:"OAuth consent and Gmail API sync",icon:Mail,tag:"Email"},{name:"Microsoft Outlook",desc:"Microsoft OAuth and Graph API",icon:Mail,tag:"Email"},{name:"WhatsApp Business",desc:"Official Business Platform integration",icon:MessageCircle,tag:"Messaging"},{name:"Telegram",desc:"Bot API integration",icon:Send,tag:"Messaging"},{name:"Instagram & Facebook",desc:"Meta business account permissions and messaging APIs",icon:Instagram,tag:"Social"},{name:"LinkedIn",desc:"Approved organization and marketing integrations",icon:Linkedin,tag:"Social"},{name:"YouTube",desc:"Channel analytics and publishing integrations where authorized",icon:Youtube,tag:"Video"}].map((c) => {const Icon=c.icon;return <div className="channel-card" key={c.name}><div className="channel-card-top"><div className="channel-logo"><Icon size={21}/></div><span className="connection-status"><i/> Not connected</span></div><h3>{c.name}</h3><p>{c.desc}</p><div className="channel-card-bottom"><span className="category-chip">{c.tag}</span><button className="button button-secondary small" onClick={() => c.name === "Hostinger Email" ? router.push("/connect-email") : onNotice(c.name + ": provider setup is planned and not active yet.")}>Configure <ArrowUpRight size={13}/></button></div></div>;})}</div></div>;

  if (section === "tasks") return <div className="module-stack"><div className="module-toolbar"><div><h2 className="section-heading">Follow-up queue</h2><span className="panel-sub">A single action list across all channels</span></div><button className="button button-primary" onClick={() => onNotice("Task creation will persist to Supabase in the next phase.")}><Plus size={15}/> Add task</button></div><div className="data-card">{[["Review failed email deliveries","Email operations","High","Today"],["Reply to Serbia employer about shortlist","Recruitment","High","Today"],["Send candidate refund status update","Candidate support","High","Today"],["Confirm interview availability with partner","Interviews","Normal","Tomorrow"],["Review Europe Career Week draft","Marketing","Normal","Friday"]].map((t,i)=><div className="task-row" key={t[0]}><button className="task-check" aria-label="Mark task complete" onClick={() => onNotice("Task status changed in this demo only.")}><Check size={13}/></button><div className="task-main"><strong>{t[0]}</strong><span>{t[1]}</span></div><span className={`task-priority ${t[2].toLowerCase()}`}>{t[2]}</span><span className="task-due"><Clock3 size={13}/>{t[3]}</span><button className="icon-button" onClick={() => onNotice("Task detail will be available when persistent task records are enabled.")}><MoreHorizontal size={17}/></button></div>)}</div></div>;

  if (section === "analytics") return <div className="module-stack"><div className="metrics-grid three">{[["Total conversations","4,820","+14.2%"],["First response time","2h 18m","−18.4%"],["Campaign engagement","28.6%","+3.1%"]].map((m) => <div className="metric-card" key={m[0]}><div className="metric-top"><span>{m[0]}</span><span className="metric-icon purple"><BarChart3 size={16}/></span></div><div className="metric-value">{m[1]}</div><div className="metric-foot"><span className="trend-up"><ArrowUpRight size={13}/>{m[2]}</span> sample trend</div></div>)}</div><div className="data-card chart-card"><div className="panel-heading"><div><h2>Conversation volume</h2><span className="panel-sub">Illustrative weekly activity · demo data</span></div><span className="category-chip">Last 7 days</span></div><div className="chart-bars">{[["Mon",44],["Tue",61],["Wed",49],["Thu",78],["Fri",65],["Sat",35],["Sun",53]].map((d)=><div className="chart-column" key={d[0]}><span>{d[1]*14}</span><div className="chart-track"><i style={{height:d[1]+"%"}}/></div><small>{d[0]}</small></div>)}</div><div className="chart-legend"><span><i className="legend-dot purple-dot"/>Inbound conversations</span><span><i className="legend-dot blue-dot"/>Outbound replies</span></div></div><div className="info-banner"><Activity size={17}/><div><strong>Metrics become real after provider sync</strong><p>Delivery, response-time and campaign metrics must be calculated from provider events and stored message activity—not from demo numbers.</p></div></div></div>;

  return <div className="module-stack"><div className="data-card settings-card"><div className="panel-heading"><div><h2>Workspace configuration</h2><span className="panel-sub">GL-MOS Communication Cloud</span></div><Settings size={19}/></div>{[["Workspace profile","Rabbani Placement & Education Consultancy Services Pvt Ltd"],["Data and access","Supabase Auth, workspace membership and Row Level Security"],["Connected accounts","No provider accounts connected in this MVP"],["Notifications","Follow-up reminders and delivery alerts (planned)"],["Security and audit","Encrypted provider credentials, audit events and scoped access (required before production)"]].map((s)=><div className="setting-row" key={s[0]}><div><strong>{s[0]}</strong><span>{s[1]}</span></div><button className="button button-secondary small" onClick={() => onNotice(s[0] + " settings are not yet backed by live configuration.")}>Review <ArrowUpRight size={13}/></button></div>)}</div><div className="info-banner amber-banner"><ShieldCheck size={17}/><div><strong>Production checklist</strong><p>Configure Supabase URL and publishable key, migrations, workspace RLS policies, server-only provider credentials, OAuth redirect URLs, audit logs and provider webhooks before handling real customer communications.</p></div></div></div>;
}
