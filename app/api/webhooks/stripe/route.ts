import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();
  let event: Stripe.Event;
  try {
    // 署名検証なしで受け付けるのは典型的な穴（docs/incident.md 参照）
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (event.type === "checkout.session.completed") {
    const s = event.data.object as Stripe.Checkout.Session;
    const tenantId = s.metadata?.tenant_id ?? s.client_reference_id;
    if (tenantId) {
      await admin.from("subscriptions").upsert({
        tenant_id: tenantId,
        stripe_customer_id: typeof s.customer === "string" ? s.customer : s.customer?.id ?? null,
        stripe_subscription_id: typeof s.subscription === "string" ? s.subscription : s.subscription?.id ?? null,
        status: "active",
        plan: "pro",
        updated_at: now,
      });
    }
  }
  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    await admin.from("subscriptions")
      .update({ status: "canceled", plan: "free", updated_at: now })
      .eq("stripe_subscription_id", sub.id);
  }
  return NextResponse.json({ received: true });
}
