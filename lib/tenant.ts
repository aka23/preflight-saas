import { createClient } from "@/lib/supabase/server";

export const FREE_REPORT_LIMIT = 3;

export async function getCurrentContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: membership } = await supabase
    .from("memberships").select("tenant_id, role").eq("user_id", user.id).limit(1).maybeSingle();
  const tenantId = membership?.tenant_id as string | undefined;
  let tenantName = "(no tenant)";
  let sub: { status: string; plan: string } | null = null;
  if (tenantId) {
    const { data: t } = await supabase.from("tenants").select("name").eq("id", tenantId).maybeSingle();
    tenantName = t?.name ?? tenantName;
    const { data } = await supabase.from("subscriptions").select("status, plan").eq("tenant_id", tenantId).maybeSingle();
    sub = data;
  }
  const isPro = sub?.plan === "pro" && (sub.status === "active" || sub.status === "trialing");
  return { supabase, user, tenantId, tenantName, role: membership?.role as string | undefined, isPro };
}
