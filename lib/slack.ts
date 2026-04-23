import crypto from "node:crypto";

import { WebClient } from "@slack/web-api";

import { getInstallation } from "@/lib/database";

type VerifyRequestInput = {
  rawBody: string;
  signature: string | null;
  timestamp: string | null;
};

export type SlackThreadMessage = {
  user: string;
  text: string;
  ts: string;
};

type OAuthExchangeResult = {
  ok: boolean;
  error?: string;
  team?: {
    id: string;
    name: string;
  };
  bot_user_id?: string;
  access_token?: string;
  enterprise?: {
    id?: string;
  };
  authed_user?: {
    id?: string;
  };
};

export function getSlackBotScopes() {
  return process.env.SLACK_BOT_SCOPES ?? "app_mentions:read,channels:history,chat:write,groups:history,im:history,mpim:history";
}

export function buildSlackInstallUrl(state: string, redirectUri: string) {
  const params = new URLSearchParams({
    client_id: process.env.SLACK_CLIENT_ID ?? "",
    scope: getSlackBotScopes(),
    state,
    redirect_uri: redirectUri,
  });

  return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
}

export async function exchangeSlackOAuthCode(code: string, redirectUri: string) {
  const clientId = process.env.SLACK_CLIENT_ID;
  const clientSecret = process.env.SLACK_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing SLACK_CLIENT_ID or SLACK_CLIENT_SECRET.");
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code,
    redirect_uri: redirectUri,
  });

  const response = await fetch("https://slack.com/api/oauth.v2.access", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const payload = (await response.json()) as OAuthExchangeResult & {
    team?: { id: string; name: string; domain?: string };
  };

  if (!payload.ok || !payload.access_token || !payload.team?.id || !payload.team.name) {
    throw new Error(payload.error ?? "Slack OAuth exchange failed.");
  }

  return payload;
}

export function verifySlackRequest({ rawBody, signature, timestamp }: VerifyRequestInput) {
  const signingSecret = process.env.SLACK_SIGNING_SECRET;
  if (!signingSecret) {
    return true;
  }

  if (!signature || !timestamp) {
    return false;
  }

  const requestTs = Number(timestamp);
  if (Number.isNaN(requestTs)) {
    return false;
  }

  const fiveMinutes = 60 * 5;
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - requestTs) > fiveMinutes) {
    return false;
  }

  const baseString = `v0:${timestamp}:${rawBody}`;
  const digest = `v0=${crypto.createHmac("sha256", signingSecret).update(baseString).digest("hex")}`;

  const expected = Buffer.from(digest, "utf8");
  const actual = Buffer.from(signature, "utf8");

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function getSlackClient(teamId: string) {
  const installation = await getInstallation(teamId);

  if (!installation) {
    throw new Error(`No Slack installation found for team ${teamId}.`);
  }

  return {
    client: new WebClient(installation.botToken),
    installation,
  };
}

export function parseSlackThreadUrl(threadUrl: string) {
  try {
    const parsed = new URL(threadUrl);
    const match = parsed.pathname.match(/^\/archives\/([A-Z0-9]+)\/p(\d{7,})$/i);
    if (!match) {
      return null;
    }

    const [, channel, rawTs] = match;
    if (rawTs.length <= 6) {
      return null;
    }

    const seconds = rawTs.slice(0, -6);
    const micros = rawTs.slice(-6);

    return {
      teamDomain: parsed.hostname.split(".")[0]?.toLowerCase(),
      channel,
      threadTs: `${seconds}.${micros}`,
    };
  } catch {
    return null;
  }
}

export async function fetchSlackThreadMessages(params: {
  teamId: string;
  channel: string;
  threadTs: string;
  limit?: number;
}) {
  const { client } = await getSlackClient(params.teamId);

  const response = await client.conversations.replies({
    channel: params.channel,
    ts: params.threadTs,
    limit: params.limit ?? 120,
    inclusive: true,
  });

  if (!response.ok) {
    throw new Error(response.error ?? "Failed to fetch Slack thread messages.");
  }

  return (response.messages ?? [])
    .filter((message): message is { user?: string; text?: string; ts?: string; bot_id?: string; subtype?: string } =>
      Boolean(message.ts && typeof message.text === "string"),
    )
    .map((message) => ({
      user: message.user ?? message.bot_id ?? "unknown",
      text: message.text ?? "",
      ts: message.ts ?? "",
    }));
}

export async function postThreadSummary(params: {
  teamId: string;
  channel: string;
  threadTs: string;
  summary: string;
}) {
  const { client } = await getSlackClient(params.teamId);

  const result = await client.chat.postMessage({
    channel: params.channel,
    thread_ts: params.threadTs,
    text: params.summary,
    mrkdwn: true,
  });

  if (!result.ok) {
    throw new Error(result.error ?? "Failed to post summary to Slack.");
  }
}

export function stripBotMention(text: string, botUserId?: string) {
  if (!botUserId) {
    return text.trim();
  }

  return text.replaceAll(`<@${botUserId}>`, "").trim();
}
