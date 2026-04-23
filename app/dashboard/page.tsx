import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowLeft, BadgeCheck, Lock, Rocket } from "lucide-react";

import { PricingCard } from "@/components/PricingCard";
import { SlackInstallButton } from "@/components/SlackInstallButton";
import { SummaryForm } from "@/components/SummaryForm";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listInstallations, getUsageSnapshot } from "@/lib/database";
import { isPaidCookieValid, PAYWALL_COOKIE_NAME } from "@/lib/paywall";

type DashboardPageProps = {
  searchParams?: Promise<{
    unlock?: string;
    connected?: string;
  }>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const cookieStore = await cookies();
  const accessCookie = cookieStore.get(PAYWALL_COOKIE_NAME)?.value;
  const paid = accessCookie ? isPaidCookieValid(accessCookie) : false;

  const [installations, usage] = await Promise.all([listInstallations(), getUsageSnapshot()]);
  const defaultTeamId = installations[0]?.teamId ?? "";
  const unlockStatus = resolvedSearchParams?.unlock;

  return (
    <main className="mx-auto max-w-5xl px-4 pb-20 pt-8 sm:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-300 hover:text-sky-300">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
        <Badge variant={paid ? "default" : "muted"}>{paid ? "Paid access active" : "Locked"}</Badge>
      </div>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Connected workspaces</CardDescription>
            <CardTitle>{installations.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Summaries generated today</CardDescription>
            <CardTitle>{usage.totalToday}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Total summaries all-time</CardDescription>
            <CardTitle>{usage.totalAllTime}</CardTitle>
          </CardHeader>
        </Card>
      </section>

      {resolvedSearchParams?.connected === "1" ? (
        <Card className="mb-6 border-emerald-700/40 bg-emerald-950/10">
          <CardContent className="pt-6 text-sm text-emerald-200">
            Slack workspace connected successfully. Your bot can now respond when mentioned in threads.
          </CardContent>
        </Card>
      ) : null}

      {unlockStatus === "success" ? (
        <Card className="mb-6 border-emerald-700/40 bg-emerald-950/10">
          <CardContent className="pt-6 text-sm text-emerald-200">Payment confirmed. Paid access cookie has been activated.</CardContent>
        </Card>
      ) : null}

      {unlockStatus && unlockStatus !== "success" ? (
        <Card className="mb-6 border-amber-700/40 bg-amber-950/10">
          <CardContent className="pt-6 text-sm text-amber-200">
            Could not verify checkout session automatically. Complete payment, then reopen your success link.
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-sky-300" />
              Connect Slack
            </CardTitle>
            <CardDescription>Install the bot so mentions in long threads trigger AI summaries.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SlackInstallButton />
            <p className="text-sm text-slate-400">
              Required scopes: app mentions, channel history, and chat write. OAuth callback path:
              <code className="ml-1 rounded bg-slate-950 px-1 py-0.5 text-slate-300">/api/slack/oauth</code>
            </p>
          </CardContent>
        </Card>

        {!paid ? (
          <Card className="border-sky-700/35 bg-slate-900/75">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-sky-300" />
                Unlock the summarizer tool
              </CardTitle>
              <CardDescription>
                The manual thread summarizer is available after purchase and protected by a secure cookie.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-slate-300">
              <p>1. Complete checkout.</p>
              <p>
                2. Configure Stripe success URL to
                <code className="mx-1 rounded bg-slate-950 px-1 py-0.5 text-slate-300">/unlock?session_id={'{CHECKOUT_SESSION_ID}'}</code>
              </p>
              <p>3. You will be redirected back with paid access active.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-emerald-700/35 bg-emerald-950/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-emerald-300" />
                Access enabled
              </CardTitle>
              <CardDescription>You can now summarize any Slack thread from this dashboard.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </section>

      {paid ? (
        <section className="mt-6">
          <SummaryForm defaultTeamId={defaultTeamId} />
        </section>
      ) : (
        <section className="mt-6">
          <PricingCard />
        </section>
      )}
    </main>
  );
}
