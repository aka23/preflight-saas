import "./globals.css";
import Link from "next/link";
import type { ReactNode } from "react";

export const metadata = { title: "Preflight — AI SaaS 公開前診断デモ", description: "半完成AI SaaSを公開前に診断する見本" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-4xl items-center gap-4 p-4 text-sm">
            <Link href="/" className="font-bold">Preflight</Link>
            <Link href="/app">ダッシュボード</Link>
            <Link href="/app/billing">課金</Link>
            <Link href="/app/demo/security">セキュリティデモ</Link>
            <Link href="/docs">ドキュメント</Link>
            <span className="ml-auto rounded bg-amber-100 px-2 py-0.5 text-amber-800">DEMO / Stripeテストモード</span>
          </nav>
        </header>
        <main className="mx-auto max-w-4xl p-6">{children}</main>
      </body>
    </html>
  );
}
