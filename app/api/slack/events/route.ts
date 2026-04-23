import { NextResponse } from "next/server";

import { incrementUsage } from "@/lib/database";
import { summarizeThreadWithOpenAI } from "@/lib/openai";
import { fetchSlackThreadMessages, postThreadSummary, verifySlackRequest } from "@/lib/slack";

export const runtime = "nodejs";

type SlackEventPayload = {
  type: string;
  challenge?: string;
  team_id?: string;
  authorizations?: Array<{
    team_id?: string;
  }>;
  event?: {
    type?: string;
    bot_id?: string;
    subtype?: string;
    channel?: string;
    ts?: string;
    thread_ts?: string;
  };
};

function getTeamId(payload: SlackEventPayload) {
  return payload.team_id ?? payload.authorizations?.[0]?.team_id;
}

async function handleMention(payload: SlackEventPayload) {
  const event = payload.event;
  const teamId = getTeamId(payload);

  if (!event?.channel || !event.ts || !teamId) {
    return;
  }

  if (event.subtype === "bot_message" || event.bot_id) {
    return;
  }

  const threadTs = event.thread_ts ?? event.ts;

  try {
    const messages = await fetchSlackThreadMessages({
      teamId,
      channel: event.channel,
      threadTs,
      limit: 150,
    });

    if (messages.length === 0) {
      await postThreadSummary({
        teamId,
        channel: event.channel,
        threadTs,
        summary: "I could not find messages in this thread to summarize.",
      });
      return;
    }

    const summary = await summarizeThreadWithOpenAI(messages);

    await postThreadSummary({
      teamId,
      channel: event.channel,
      threadTs,
      summary: `*Thread TL;DR*\n${summary}`,
    });

    await incrementUsage(teamId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";

    await postThreadSummary({
      teamId,
      channel: event.channel,
      threadTs,
      summary: `I couldn't summarize this thread right now. ${message}`,
    }).catch(() => undefined);
  }
}

export async function POST(request: Request) {
  const rawBody = await request.text();

  if (
    !verifySlackRequest({
      rawBody,
      signature: request.headers.get("x-slack-signature"),
      timestamp: request.headers.get("x-slack-request-timestamp"),
    })
  ) {
    return NextResponse.json({ error: "invalid_signature" }, { status: 401 });
  }

  let payload: SlackEventPayload;

  try {
    payload = JSON.parse(rawBody) as SlackEventPayload;
  } catch {
    return NextResponse.json({ error: "invalid_payload" }, { status: 400 });
  }

  if (payload.type === "url_verification" && payload.challenge) {
    return NextResponse.json({ challenge: payload.challenge });
  }

  if (payload.type === "event_callback" && payload.event?.type === "app_mention") {
    void handleMention(payload);
  }

  return NextResponse.json({ ok: true });
}
