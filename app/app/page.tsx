import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Link from "next/link";
import { getCurrentContext, FREE_REPORT_LIMIT } from "@/lib/tenant";

type Finding = { severity: string; item: string; note: string };

async function createReport() {
  "use server";
  const ctx = await getCurrentContext();
  if (!ctx?.tenantId) redirect("/login");
  const { count } = await ctx.supabase.from("reports").select("id", { count: "exact", head: true }).eq("tenant_id", ctx.tenantId);
  if (!ctx.isPro && (count ?? 0) >= FREE_REPORT_LIMIT) redirect("/app?limit=1");
  const findings: Finding[] = [
    { severity: "high", item: "RLS", note: "全テーブルで RLS 有効か / ポリシーが tenant 単位か" },
    { severity: "medium", item: "env", note: "NEXT_PUBLIC_ 接頭辞に秘密値が無いか" },
    { severity: "medium", item: "authz", note: "API が tenant_id を信頼せず membership を確認しているか" },
  ];
  await ctx.supabase.from("reports").insert({ tenant_id: ctx.tenantId, title: `診断 ${new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })}`, findings });
  revalidatePath("/app");
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ limit?: string }> }) {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/login");
  const { limit } = await searchParams;
  const { data: reports } = await ctx.supabase
    .from("reports").select("id, title, findings, created_at").order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{ctx.tenantName}</h1>
          <p className="text-sm text-slate-600">
            {ctx.user.email} / role: {ctx.role} / tenant_id: <code>{ctx.tenantId}</code> / プラン:{" "}
            <span className={ctx.isPro ? "font-bold text-green-700" : ""}>{ctx.isPro ? "Pro" : "Free"}</span>
          </p>
        </div>
        <form action="/auth/signout" method="post"><button className="text-sm underline">ログアウト</button></form>
      </div>
      {limit && (
        <p className="rounded border border-amber-300 bg-amber-50 p-3 text-sm">
          Free プランは診断レポート {FREE_REPORT_LIMIT} 件までです。<Link className="underline" href="/app/billing">Pro にアップグレード</Link>
        </p>
      )}
      <form action={createReport}><button className="rounded bg-slate-900 px-3 py-2 text-sm text-white">診断レポートを作成（モック）</button></form>
      <ul className="space-y-3">
        {(reports ?? []).map((r) => (
          <li key={r.id} className="rounded border bg-white p-4">
            <div className="font-semibold">{r.title}</div>
            <ul className="mt-2 text-sm">
              {(r.findings as Finding[]).map((f, i) => (
                <li key={i}><span className="mr-2 rounded bg-slate-100 px-1 font-mono text-xs">{f.severity}</span>{f.item}: {f.note}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}
