import OpenAI from "openai";

import type { SlackThreadMessage } from "@/lib/slack";

let openaiClient: OpenAI | null = null;

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY.");
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey });
  }

  return openaiClient;
}

function formatTimestamp(ts: string) {
  const unixSeconds = Number(ts.split(".")[0]);
  if (Number.isNaN(unixSeconds)) {
    return "unknown-time";
  }

  return new Date(unixSeconds * 1000).toISOString();
}

function toTranscript(messages: SlackThreadMessage[]) {
  return messages
    .map((message) => `[${formatTimestamp(message.ts)}] ${message.user}: ${message.text}`)
    .join("\n");
}

export async function summarizeThreadWithOpenAI(messages: SlackThreadMessage[]) {
  if (messages.length === 0) {
    throw new Error("Thread is empty.");
  }

  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const transcript = toTranscript(messages);

  const completion = await getClient().chat.completions.create({
    model,
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          "You summarize Slack threads for engineering teams. Be concise, factual, and explicit about uncertainty. Do not invent details.",
      },
      {
        role: "user",
        content: [
          "Summarize the Slack thread below.",
          "",
          "Return plain text using this format:",
          "TL;DR:",
          "- 2-3 bullets max",
          "",
          "Decisions:",
          "- bullet list",
          "",
          "Open questions:",
          "- bullet list",
          "",
          "Action items:",
          "- Owner — task (deadline if present)",
          "",
          "If a section has no content, write '- None noted'.",
          "",
          "Thread transcript:",
          transcript,
        ].join("\n"),
      },
    ],
  });

  const summary = completion.choices[0]?.message?.content?.trim();

  if (!summary) {
    throw new Error("OpenAI returned an empty summary.");
  }

  return summary;
}
