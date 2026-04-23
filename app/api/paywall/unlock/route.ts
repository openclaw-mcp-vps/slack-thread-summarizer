import { NextResponse } from "next/server";

import { hasPaidSession, recordPaidSession } from "@/lib/database";
import { createPaidCookieValue, PAYWALL_COOKIE_MAX_AGE_SECONDS, PAYWALL_COOKIE_NAME } from "@/lib/paywall";
import { verifyCheckoutSessionPaid } from "@/lib/stripe";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sessionId = url.searchParams.get("session_id");

  if (!sessionId) {
    return NextResponse.redirect(new URL("/dashboard?unlock=missing_session", request.url));
  }

  let paid = await hasPaidSession(sessionId);

  if (!paid) {
    try {
      paid = await verifyCheckoutSessionPaid(sessionId);
      if (paid) {
        await recordPaidSession(sessionId);
      }
    } catch {
      paid = false;
    }
  }

  if (!paid) {
    return NextResponse.redirect(new URL("/dashboard?unlock=verification_failed", request.url));
  }

  const response = NextResponse.redirect(new URL("/dashboard?unlock=success", request.url));

  response.cookies.set(PAYWALL_COOKIE_NAME, createPaidCookieValue(sessionId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: PAYWALL_COOKIE_MAX_AGE_SECONDS,
  });

  return response;
}
