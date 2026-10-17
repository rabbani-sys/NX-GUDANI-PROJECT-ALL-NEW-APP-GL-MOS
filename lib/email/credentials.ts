import "server-only";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

function encryptionKey(): Buffer {
  const raw = process.env.EMAIL_CREDENTIALS_ENCRYPTION_KEY;
  if (!raw || !/^[a-fA-F0-9]{64}$/.test(raw)) {
    throw new Error("EMAIL_CREDENTIALS_ENCRYPTION_KEY must be a 64-character hexadecimal key.");
  }
  return Buffer.from(raw, "hex");
}

export function encryptCredentials(value: unknown) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(value), "utf8"), cipher.final()]);
  return { ciphertext: ciphertext.toString("hex"), iv_hex: iv.toString("hex"), auth_tag_hex: cipher.getAuthTag().toString("hex"), key_version: 1 };
}

export function decryptCredentials<T>(record: { ciphertext: string; iv_hex: string; auth_tag_hex: string; key_version?: number }): T {
  if (record.key_version !== undefined && record.key_version !== 1) throw new Error("Unsupported credential encryption key version.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(record.iv_hex, "hex"));
  decipher.setAuthTag(Buffer.from(record.auth_tag_hex, "hex"));
  const plaintext = Buffer.concat([decipher.update(Buffer.from(record.ciphertext, "hex")), decipher.final()]).toString("utf8");
  return JSON.parse(plaintext) as T;
}
