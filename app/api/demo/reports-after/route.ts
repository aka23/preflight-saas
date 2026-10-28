import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/tenant";

// ✅ アフター: ユーザーのセッション（anon key + JWT）で取得。RLS が自テナントの行だけに絞る。
export async function GET() {
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data, error } = await ctx.supabase
    .from("reports").select("id, tenant_id, title, created_at")
    .order("created_at", { ascending: false }).limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []).map((r) => ({ ...r, is_mine: r.tenant_id === ctx.tenantId }));
  return NextResponse.json({ mode: "after", my_tenant_id: ctx.tenantId, count: rows.length, rows });
}
