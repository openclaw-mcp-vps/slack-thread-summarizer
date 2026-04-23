import crypto from "node:crypto";

export const PAYWALL_COOKIE_NAME = "stss_paid_access";
export const PAYWALL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type AccessPayload = {
  sessionId: string;
  exp: number;
};

function getCookieSecret() {
  return process.env.PAYWALL_COOKIE_SECRET ?? process.env.STRIPE_WEBHOOK_SECRET ?? "local-dev-paywall-secret";
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function decode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(value: string) {
  return crypto.createHmac("sha256", getCookieSecret()).update(value).digest("base64url");
}

export function createPaidCookieValue(sessionId: string) {
  const payload: AccessPayload = {
    sessionId,
    exp: Math.floor(Date.now() / 1000) + PAYWALL_COOKIE_MAX_AGE_SECONDS,
  };

  const payloadEncoded = encode(JSON.stringify(payload));
  const signature = sign(payloadEncoded);

  return `${payloadEncoded}.${signature}`;
}

export function isPaidCookieValid(value: string) {
  const parts = value.split(".");
  if (parts.length !== 2) {
    return false;
  }

  const [payloadEncoded, incomingSignature] = parts;
  const expectedSignature = sign(payloadEncoded);

  const incoming = Buffer.from(incomingSignature, "utf8");
  const expected = Buffer.from(expectedSignature, "utf8");

  if (incoming.length !== expected.length || !crypto.timingSafeEqual(incoming, expected)) {
    return false;
  }

  try {
    const payload = JSON.parse(decode(payloadEncoded)) as AccessPayload;
    return payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}
