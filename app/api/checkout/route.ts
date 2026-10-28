import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getCurrentContext } from "@/lib/tenant";

const TEST_KEY_PREFIX = "sk_test_";

export async function POST() {
  const ctx = await getCurrentContext();
  if (!ctx?.tenantId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  if (ctx.role !== "owner") return NextResponse.json({ error: "forbidden: owner only" }, { status: 403 });

  const key = process.env.STRIPE_SECRET_KEY ?? "";
  // デモ安全策: テストモードのキー以外では動かさない
  if (!key.startsWith(TEST_KEY_PREFIX)) {
    return NextResponse.json({ error: "Stripe test-mode key required" }, { status: 500 });
  }
  const stripe = new Stripe(key);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    customer_email: ctx.user.email,
    client_reference_id: ctx.tenantId,
    metadata: { tenant_id: ctx.tenantId },
    subscription_data: { metadata: { tenant_id: ctx.tenantId } },
    success_url: appUrl + "/app/billing?status=success",
    cancel_url: appUrl + "/app/billing?status=cancel",
  });
  return NextResponse.redirect(session.url!, { status: 303 });
}
