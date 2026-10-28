import { NextResponse } from "next/server";
import { getCurrentContext } from "@/lib/tenant";

// 権限エラー再現: URL の tenantId を信用せず、membership を確認する。
// 他テナントID → 403 Forbidden。
export async function GET(_req: Request, { params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;
  const ctx = await getCurrentContext();
  if (!ctx) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { data: m } = await ctx.supabase
    .from("memberships").select("role").eq("tenant_id", tenantId).eq("user_id", ctx.user.id).maybeSingle();
  if (!m) {
    return NextResponse.json(
      { error: "forbidden", message: "このテナントのメンバーではありません", tenant_id: tenantId },
      { status: 403 }
    );
  }
  const { data } = await ctx.supabase.from("reports").select("id, title, created_at").eq("tenant_id", tenantId);
  return NextResponse.json({ tenant_id: tenantId, role: m.role, reports: data ?? [] });
}
