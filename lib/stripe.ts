import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripeSecretKey() {
  const secret = process.env.STRIPE_SECRET_KEY;

  if (!secret) {
    throw new Error("Missing STRIPE_SECRET_KEY.");
  }

  return secret;
}

export function getStripeClient() {
  if (!stripeClient) {
    stripeClient = new Stripe(getStripeSecretKey());
  }

  return stripeClient;
}

export async function verifyCheckoutSessionPaid(sessionId: string) {
  const session = await getStripeClient().checkout.sessions.retrieve(sessionId);

  return session.payment_status === "paid";
}

export function constructStripeWebhookEvent(rawBody: string, signature: string | null) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("Missing STRIPE_WEBHOOK_SECRET.");
  }

  if (!signature) {
    throw new Error("Missing Stripe signature header.");
  }

  return getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
}
