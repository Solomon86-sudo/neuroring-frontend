import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NeuroRing - AI Debate",
  description: "Интеллектуальное шоу с нейро-ведущей",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased bg-slate-950">
        {children}
      </body>
    </html>
  );
}