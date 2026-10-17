import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GL-MOS Communication Cloud",
  description: "One Contact. Every Channel. One Unified Timeline.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
