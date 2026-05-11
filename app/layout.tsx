import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClosedLoop AI Production Dashboard",
  description: "AI-assisted bottle production monitoring dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
