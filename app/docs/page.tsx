import Link from "next/link";

const REPO = "https://github.com/aka23/preflight-saas";

export default function Docs() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">ドキュメント</h1>
      <ul className="list-disc pl-6">
        <li><a className="underline" href={REPO + "/blob/main/docs/incident.md"}>障害メモ（docs/incident.md）</a> — 何が壊れた／直し方／検証手順</li>
        <li><a className="underline" href={REPO + "/blob/main/supabase/migrations/20261029000000_init.sql"}>RLS 付きスキーマ（migration）</a></li>
        <li><a className="underline" href={REPO + "#readme"}>README（ローカル起動・デプロイ手順）</a></li>
      </ul>
      <section className="rounded border bg-white p-4 text-sm">
        <h2 className="font-semibold">診断で見るポイント</h2>
        <ol className="list-decimal pl-6">
          <li>全テーブルで RLS が有効か、ポリシーが tenant の membership 単位か</li>
          <li>API が URL/body の tenant_id を信用せずサーバー側で権限確認しているか（無ければ 403）</li>
          <li>NEXT_PUBLIC_ に秘密値が無いか、管理用キーがクライアントに出ていないか</li>
          <li>課金状態は署名検証済み webhook でのみ更新しているか</li>
        </ol>
      </section>
      <Link className="underline" href="/app/demo/security">→ セキュリティデモを開く</Link>
    </div>
  );
}
