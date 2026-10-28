import { redirect } from "next/navigation";
import { getCurrentContext } from "@/lib/tenant";
import DemoPanel from "./panel";

// 画面に出す「漏れて見える値」はすべて偽値。本物の env は一切読まない。
const LEAKED_LOOKING = [
  { name: "NEXT_PUBLIC_STRIPE_SECRET_KEY", value: "sk_live_REDACTED_DEMO_ONLY", why: "NEXT_PUBLIC_ を付けるとブラウザのJSバンドルに埋め込まれる" },
  { name: "NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY", value: "eyJhbGciOi...REDACTED", why: "service_role は RLS を無視できる。クライアントに出たら全データ読み書き可能" },
  { name: "OPENAI_API_KEY (console.log)", value: "sk-proj-REDACTED", why: "サーバーログ・エラーページ・Sentry にそのまま出る" },
];

export default async function SecurityDemo() {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/login");
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">セキュリティデモ（ビフォー / アフター）</h1>
      <DemoPanel myTenantId={ctx.tenantId ?? ""} />
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">env 漏れ: こう見えたら危険（すべて偽値）</h2>
        <table className="w-full border bg-white text-sm">
          <tbody>
            {LEAKED_LOOKING.map((r) => (
              <tr key={r.name} className="border-t">
                <td className="p-2 font-mono text-red-700">{r.name}</td>
                <td className="p-2 font-mono">{r.value}</td>
                <td className="p-2">{r.why}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-sm">
          アフター: 秘密値は接頭辞なしの env（STRIPE_SECRET_KEY / SUPABASE_SERVICE_ROLE_KEY）に置き、
          Route Handler など サーバー側でのみ参照。lib/supabase/admin.ts は <code>server-only</code> で
          クライアントから import するとビルドエラーになる。
        </p>
      </section>
    </div>
  );
}
