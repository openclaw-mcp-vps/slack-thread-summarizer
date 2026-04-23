import { NextResponse } from "next/server";
import { z } from "zod";

import {
  getInstallationByDomain,
  getTeamUsageToday,
  incrementUsage,
  listInstallations,
} from "@/lib/database";
import { summarizeThreadWithOpenAI } from "@/lib/openai";
import { isPaidCookieValid, PAYWALL_COOKIE_NAME } from "@/lib/paywall";
import { fetchSlackThreadMessages, parseSlackThreadUrl } from "@/lib/slack";

export const runtime = "nodejs";

const summarizeSchema = z.object({
  threadUrl: z.string().url(),
  teamId: z.string().min(1).optional(),
});

async function resolveTeamId(threadUrl: string, providedTeamId?: string) {
  if (providedTeamId) {
    return providedTeamId;
  }

  const parsed = parseSlackThreadUrl(threadUrl);
  if (parsed?.teamDomain) {
    const installation = await getInstallationByDomain(parsed.teamDomain);
    if (installation) {
      return installation.teamId;
    }
  }

  const installations = await listInstallations();
  if (installations.length === 1) {
    return installations[0].teamId;
  }

  return null;
}

export async function POST(request: Request) {
  const accessToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PAYWALL_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!accessToken || !isPaidCookieValid(accessToken)) {
    return NextResponse.json({ error: "Paid access is required." }, { status: 402 });
  }

  let body: z.infer<typeof summarizeSchema>;

  try {
    body = summarizeSchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 });
  }

  const parsedUrl = parseSlackThreadUrl(body.threadUrl);
  if (!parsedUrl) {
    return NextResponse.json(
      {
        error: "Invalid Slack thread URL. Expected format: https://your-team.slack.com/archives/CHANNEL/p1234567890123456",
      },
      { status: 400 },
    );
  }

  const teamId = await resolveTeamId(body.threadUrl, body.teamId);
  if (!teamId) {
    return NextResponse.json(
      {
        error:
          "Could not resolve team ID. Provide teamId explicitly, or connect exactly one workspace in this account.",
      },
      { status: 400 },
    );
  }

  try {
    const messages = await fetchSlackThreadMessages({
      teamId,
      channel: parsedUrl.channel,
      threadTs: parsedUrl.threadTs,
      limit: 150,
    });

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages found in thread." }, { status: 404 });
    }

    const summary = await summarizeThreadWithOpenAI(messages);
    const usageToday = await incrementUsage(teamId);

    return NextResponse.json({
      summary,
      messageCount: messages.length,
      usageToday,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown summarize error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const accessToken = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${PAYWALL_COOKIE_NAME}=`))
    ?.split("=")[1];

  if (!accessToken || !isPaidCookieValid(accessToken)) {
    return NextResponse.json({ error: "Paid access is required." }, { status: 402 });
  }

  const teamId = new URL(request.url).searchParams.get("teamId");
  if (!teamId) {
    return NextResponse.json({ error: "Missing teamId query parameter." }, { status: 400 });
  }

  const usageToday = await getTeamUsageToday(teamId);

  return NextResponse.json({ teamId, usageToday });
}
