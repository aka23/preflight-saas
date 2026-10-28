import Link from "next/link";

export default function Home() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Preflight — AI SaaS 公開前診断（デモ）</h1>
      <p>
        「動くけど公開して大丈夫？」という半完成の AI SaaS を想定し、公開前によく見つかる問題
        （RLS の穴、他テナントのデータ参照、環境変数の漏れ、課金フラグの扱い）を
        <strong>ビフォー / アフター</strong>で確認できる小さな見本アプリです。
      </p>
      <section className="rounded border bg-white p-4">
        <h2 className="font-semibold">スタック</h2>
        <ul className="list-disc pl-6 text-sm">
          <li>Next.js App Router + TypeScript + Tailwind CSS</li>
          <li>Supabase Auth（メール + パスワード）+ Postgres RLS</li>
          <li>Stripe Checkout + Webhook（テストモードのみ）</li>
        </ul>
      </section>
      <section className="rounded border bg-white p-4 text-sm">
        <h2 className="font-semibold">使い方</h2>
        <ol className="list-decimal pl-6">
          <li><Link className="underline" href="/signup">サインアップ</Link> してダッシュボードで診断レポートを確認</li>
          <li><Link className="underline" href="/app/billing">課金</Link> でテストカード 4242 4242 4242 4242 を使い Pro 化</li>
          <li><Link className="underline" href="/app/demo/security">セキュリティデモ</Link> で他テナントIDを指定して 403 を再現</li>
        </ol>
      </section>
      <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
        注意: これはデモです。実際の課金は発生しません（Stripe テストモード）。画面に出る秘密鍵風の文字列はすべて偽値です。
        「壊れた例」は説明用で、本番スキーマには正しい RLS のみを適用しています。
      </p>
    </div>
  );
}
