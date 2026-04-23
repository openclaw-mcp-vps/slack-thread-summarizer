import { NextResponse } from "next/server";

import { saveInstallation } from "@/lib/database";
import { exchangeSlackOAuthCode } from "@/lib/slack";

export const runtime = "nodejs";

const SLACK_STATE_COOKIE = "stss_slack_oauth_state";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const cookieState = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SLACK_STATE_COOKIE}=`))
    ?.split("=")[1];

  if (!code || !state || !cookieState || state !== cookieState) {
    return NextResponse.redirect(new URL("/dashboard?connected=0&error=state_mismatch", request.url));
  }

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? url.origin;
    const redirectUri = `${appUrl}/api/slack/oauth`;
    const oauth = await exchangeSlackOAuthCode(code, redirectUri);

    await saveInstallation({
      teamId: oauth.team?.id ?? "",
      teamName: oauth.team?.name ?? "Unknown Team",
      teamDomain: oauth.team?.domain,
      botToken: oauth.access_token ?? "",
      botUserId: oauth.bot_user_id,
      installedAt: new Date().toISOString(),
      enterpriseId: oauth.enterprise?.id,
    });

    const response = NextResponse.redirect(new URL("/dashboard?connected=1", request.url));
    response.cookies.delete(SLACK_STATE_COOKIE);
    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "oauth_failed";
    return NextResponse.redirect(new URL(`/dashboard?connected=0&error=${encodeURIComponent(message)}`, request.url));
  }
}
