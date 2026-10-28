import { redirect } from "next/navigation";
import { getCurrentContext, FREE_REPORT_LIMIT } from "@/lib/tenant";

export default async function Billing({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const ctx = await getCurrentContext();
  if (!ctx) redirect("/login");
  const { status } = await searchParams;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">課金（Stripe テストモード）</h1>
      {status === "success" && <p className="rounded bg-green-50 p-3 text-sm">決済完了。webhook 反映まで数秒かかる場合があります（再読み込みしてください）。</p>}
      {status === "cancel" && <p className="rounded bg-slate-100 p-3 text-sm">キャンセルしました。</p>}
      <p>現在のプラン: <strong>{ctx.isPro ? "Pro" : "Free"}</strong></p>
      <ul className="list-disc pl-6 text-sm">
        <li>Free: 診断レポート {FREE_REPORT_LIMIT} 件まで</li>
        <li>Pro: 無制限（webhook で subscriptions.plan = &apos;pro&apos; に更新）</li>
      </ul>
      {!ctx.isPro && (
        <form action="/api/checkout" method="post">
          <button className="rounded bg-indigo-600 px-4 py-2 text-white">Stripe Checkout へ（テスト）</button>
        </form>
      )}
      <p className="text-sm text-slate-600">テストカード: 4242 4242 4242 4242 / 有効期限は未来の任意日付 / CVC 任意3桁</p>
    </div>
  );
}
