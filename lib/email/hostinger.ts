import "server-only";
import { ImapFlow } from "imapflow";

export type HostingerCredentials = {
  email: string;
  password: string;
  imapHost: string;
  imapPort: number;
  smtpHost: string;
  smtpPort: number;
};

export function createImapClient(credentials: HostingerCredentials) {
  return new ImapFlow({
    host: credentials.imapHost,
    port: credentials.imapPort,
    secure: credentials.imapPort === 993,
    auth: { user: credentials.email, pass: credentials.password },
    logger: false,
    connectionTimeout: 15000,
    greetingTimeout: 15000,
    socketTimeout: 20000,
  });
}

export async function verifyHostingerMailbox(credentials: HostingerCredentials) {
  const client = createImapClient(credentials);
  try {
    await client.connect();
    await client.mailboxOpen("INBOX", { readOnly: true });
  } finally {
    if (client.usable) await client.logout().catch(() => undefined);
  }
}

export async function getRecentHostingerMessages(credentials: HostingerCredentials, limit = 25) {
  const client = createImapClient(credentials);
  try {
    await client.connect();
    const mailbox = await client.mailboxOpen("INBOX", { readOnly: true });
    const exists = mailbox.exists ?? 0;
    if (exists === 0) return [];
    const boundedLimit = Math.max(1, Math.min(50, Math.floor(limit)));
    const start = Math.max(1, exists - boundedLimit + 1);
    const rows = [];
    for await (const message of client.fetch(`${start}:*`, { uid: true, envelope: true, flags: true, internalDate: true })) {
      const sender = message.envelope?.from?.[0];
      rows.push({
        uid: message.uid,
        subject: message.envelope?.subject ?? "(no subject)",
        fromName: sender?.name ?? "",
        fromAddress: sender?.address ?? "",
        date: message.internalDate ? (typeof message.internalDate === "string" ? new Date(message.internalDate).toISOString() : message.internalDate.toISOString()) : null,
        unread: !message.flags?.has("\\Seen"),
        messageId: message.envelope?.messageId ?? null,
      });
    }
    return rows.sort((a, b) => b.uid - a.uid);
  } finally {
    if (client.usable) await client.logout().catch(() => undefined);
  }
}
