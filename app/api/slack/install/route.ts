import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { buildSlackInstallUrl } from "@/lib/slack";

export const runtime = "nodejs";

const SLACK_STATE_COOKIE = "stss_slack_oauth_state";

export async function GET(request: Request) {
  const state = crypto.randomBytes(24).toString("hex");
  const requestUrl = new URL(request.url);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? requestUrl.origin;
  const redirectUri = `${appUrl}/api/slack/oauth`;

  const installUrl = buildSlackInstallUrl(state, redirectUri);
  const response = NextResponse.redirect(installUrl);

  response.cookies.set(SLACK_STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 10,
  });

  return response;
}
