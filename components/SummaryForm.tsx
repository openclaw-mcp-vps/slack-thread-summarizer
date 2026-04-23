"use client";

import { FormEvent, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SummaryResponse = {
  summary: string;
  messageCount: number;
  usageToday: number;
};

type Props = {
  defaultTeamId: string;
};

export function SummaryForm({ defaultTeamId }: Props) {
  const [threadUrl, setThreadUrl] = useState("");
  const [teamId, setTeamId] = useState(defaultTeamId);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SummaryResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const ready = useMemo(() => threadUrl.trim().length > 0, [threadUrl]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threadUrl,
          teamId: teamId.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { error?: string } & Partial<SummaryResponse>;

      if (!response.ok || !payload.summary) {
        throw new Error(payload.error ?? "Summary request failed.");
      }

      setResult({
        summary: payload.summary,
        messageCount: payload.messageCount ?? 0,
        usageToday: payload.usageToday ?? 0,
      });
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unexpected error while summarizing thread.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Summarize a Slack Thread</CardTitle>
          <CardDescription>
            Paste a Slack thread link. The app fetches the full conversation and returns a concise TL;DR with decisions and actions.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="thread-url" className="text-sm font-medium text-slate-200">
                Slack thread URL
              </label>
              <Input
                id="thread-url"
                type="url"
                value={threadUrl}
                onChange={(event) => setThreadUrl(event.target.value)}
                placeholder="https://acme.slack.com/archives/C1234567/p1712771760188059"
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="team-id" className="text-sm font-medium text-slate-200">
                Team ID (optional when one workspace is connected)
              </label>
              <Input
                id="team-id"
                type="text"
                value={teamId}
                onChange={(event) => setTeamId(event.target.value)}
                placeholder="T1234567"
              />
            </div>
            <Button type="submit" size="lg" disabled={!ready || loading} className="w-full sm:w-auto">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Generate TL;DR
            </Button>
          </form>
        </CardContent>
      </Card>

      {error ? (
        <Card className="border-rose-800/60 bg-rose-950/20">
          <CardContent className="pt-6 text-sm text-rose-200">{error}</CardContent>
        </Card>
      ) : null}

      {result ? (
        <Card>
          <CardHeader>
            <CardTitle>Summary Ready</CardTitle>
            <CardDescription>
              {result.messageCount} messages analyzed. {result.usageToday} summaries generated today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-100">{result.summary}</pre>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
