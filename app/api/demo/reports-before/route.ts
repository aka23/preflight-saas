import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/tenant";

// ビフォー（壊れた例の再現）: RLS 無効テーブルを tenant で絞らずに読んだときのレスポンス形。
// 公開デモで実ユーザーのデータを晒さないため、他テナント行は固定のダミーで合成する。
const OTHER_TENANT_ROWS = [
  { id: "demo-1", tenant_id: "11111111-aaaa-4aaa-8aaa-111111111111", title: "ダミー社A: 診断レポート", created_at: "2026-10-01T00:00:00Z" },
  { id: "demo-2", tenant_id: "22222222-bbbb-4bbb-8bbb-222222222222", title: "ダミー社B: 診断レポート", created_at: "2026-10-02T00:00:00Z" },
];

export async function GET() {
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data } = await ctx.supabase.from("reports").select("id, tenant_id, title, created_at").limit(20);
  const mine = (data ?? []).map((r) => ({ ...r, is_mine: true }));
  const others = OTHER_TENANT_ROWS.map((r) => ({ ...r, is_mine: false }));
  return NextResponse.json({ mode: "before", simulated: true, my_tenant_id: ctx.tenantId, rows: [...mine, ...others] });
}
