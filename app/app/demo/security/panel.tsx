"use client";
import { useState } from "react";

const OTHER_TENANT = "22222222-bbbb-4bbb-8bbb-222222222222";

export default function DemoPanel({ myTenantId }: { myTenantId: string }) {
  const [out, setOut] = useState<{ label: string; status: number; body: string } | null>(null);
  const [tid, setTid] = useState(OTHER_TENANT);

  async function call(label: string, url: string) {
    const res = await fetch(url);
    setOut({ label, status: res.status, body: JSON.stringify(await res.json(), null, 2) });
  }

  return (
    <div className="space-y-4">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded border border-red-300 bg-red-50 p-4 text-sm">
          <h2 className="font-semibold">ビフォー: RLS 無し</h2>
          <p>tenant で絞らないクエリ + RLS 無効 → 他テナントの行が混ざる（偽データで再現）。</p>
          <button className="mt-2 rounded bg-red-600 px-3 py-1 text-white" onClick={() => call("before", "/api/demo/reports-before")}>GET /api/demo/reports-before</button>
        </div>
        <div className="rounded border border-green-300 bg-green-50 p-4 text-sm">
          <h2 className="font-semibold">アフター: RLS あり</h2>
          <p>同じクエリでも RLS が自分の membership がある tenant の行だけ返す。</p>
          <button className="mt-2 rounded bg-green-700 px-3 py-1 text-white" onClick={() => call("after", "/api/demo/reports-after")}>GET /api/demo/reports-after</button>
        </div>
      </section>
      <section className="rounded border bg-white p-4 text-sm">
        <h2 className="font-semibold">権限エラー再現（403）</h2>
        <p>自分の tenant_id: <code>{myTenantId}</code></p>
        <input className="mt-2 w-full rounded border p-1 font-mono" value={tid} onChange={(e) => setTid(e.target.value)} />
        <div className="mt-2 flex gap-2">
          <button className="rounded bg-slate-900 px-3 py-1 text-white" onClick={() => call("tenant", "/api/tenants/" + tid + "/reports")}>指定テナントを取得</button>
          <button className="rounded border px-3 py-1" onClick={() => setTid(myTenantId)}>自分のIDに戻す</button>
        </div>
      </section>
      {out && (
        <pre className="overflow-auto rounded bg-slate-900 p-4 text-xs text-slate-100">{out.label} → HTTP {out.status}{"\n"}{out.body}</pre>
      )}
    </div>
  );
}
