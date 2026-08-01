import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "@/components/app-providers";

export const metadata: Metadata = {
  title: "Dokument AI — Profesionalni dokumenti jednostavno",
  description: "Opišite šta vam treba i pripremite profesionalan dokument brzo i jednostavno.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hr" className="h-full antialiased">
      <body className="min-h-full flex flex-col"><AppProviders>{children}</AppProviders></body>
    </html>
  );
}
