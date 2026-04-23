import type Stripe from "stripe";
import { NextResponse } from "next/server";

import { recordPaidSession } from "@/lib/database";
import { constructStripeWebhookEvent } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const rawBody = await request.text();

  let event: Stripe.Event;

  try {
    event = constructStripeWebhookEvent(rawBody, request.headers.get("stripe-signature"));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid webhook";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    await recordPaidSession(session.id, session.customer_details?.email ?? session.customer_email ?? undefined);
  }

  return NextResponse.json({ received: true });
}
