import Link from "next/link";
import { ArrowRight, Clock, MessageSquareText, ShieldCheck, Sparkles } from "lucide-react";

import { PricingCard } from "@/components/PricingCard";
import { SlackInstallButton } from "@/components/SlackInstallButton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const painPoints = [
  {
    title: "Critical decisions buried in reply 87",
    body: "Context switching to scan giant threads causes delays and repeated questions in standup.",
  },
  {
    title: "Managers spend hours reconstructing context",
    body: "By the time someone catches up, action items are stale and ownership is unclear.",
  },
  {
    title: "Important blockers get lost",
    body: "Without a concise recap, blocked work lingers and releases slip.",
  },
];

const outcomes = [
  {
    title: "Mention the bot in-thread",
    body: "Use @Thread Summarizer in any long Slack discussion where people need instant context.",
    icon: MessageSquareText,
  },
  {
    title: "AI extracts what matters",
    body: "The model identifies decisions, unresolved questions, blockers, and explicit action items.",
    icon: Sparkles,
  },
  {
    title: "Ship with confidence",
    body: "Everyone sees the same TL;DR, so engineering managers can move forward without rereading the full thread.",
    icon: ShieldCheck,
  },
];

export default function HomePage() {
  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between rounded-xl border border-slate-800/90 bg-slate-900/70 px-4 py-3 backdrop-blur sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-2.5 w-2.5 rounded-full bg-sky-400" />
          <p className="text-sm font-medium text-slate-200">slack-thread-summarizer</p>
        </div>
        <Link href="/dashboard" className="text-sm font-medium text-sky-300 transition-colors hover:text-sky-200">
          Dashboard
        </Link>
      </header>

      <section className="grid gap-10 pb-18 pt-14 md:grid-cols-[1.35fr_1fr] md:items-center">
        <div className="space-y-7">
          <Badge className="w-fit">AI summaries of long Slack threads</Badge>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight text-slate-50 sm:text-5xl">
              Stop rereading every Slack reply to find one decision.
            </h1>
            <p className="max-w-2xl text-base leading-relaxed text-slate-300 sm:text-lg">
              Thread Summarizer gives remote teams instant TL;DR recaps when the bot is mentioned. It highlights decisions,
              unresolved questions, and action owners so people can catch up in under a minute.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <SlackInstallButton />
            <Link href="/dashboard">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
          <div className="grid gap-3 text-sm text-slate-300 sm:grid-cols-3">
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="font-semibold text-slate-100">2,400+</div>
              <div>messages summarized weekly</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="font-semibold text-slate-100">64%</div>
              <div>faster thread catch-up</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
              <div className="font-semibold text-slate-100">$15/mo</div>
              <div>flat pricing per team</div>
            </div>
          </div>
        </div>

        <Card className="border-sky-500/20 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-50">
              <Clock className="h-5 w-5 text-sky-300" />
              Typical TL;DR Output
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap text-sm leading-relaxed text-slate-200">
{`Thread: #infra-alerts / Deploy rollback discussion

Decision:
• Roll back service-api to v3.14.2 until memory leak patch is validated.

Why:
• Spike in pod OOM kills began within 12 minutes of v3.15.0 release.

Action items:
• Priya: ship hotfix branch by 16:00 UTC.
• Mateo: monitor error budget + update status page every 30m.
• Nina: post root-cause summary in #eng-announcements.`}
            </pre>
          </CardContent>
        </Card>
      </section>

      <section className="py-10">
        <h2 className="mb-6 text-2xl font-semibold text-slate-50 sm:text-3xl">Why teams lose hours in Slack threads</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {painPoints.map((item) => (
            <Card key={item.title}>
              <CardHeader>
                <CardTitle className="text-lg">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-300">{item.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="py-10">
        <h2 className="mb-6 text-2xl font-semibold text-slate-50 sm:text-3xl">How Thread Summarizer works</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {outcomes.map((outcome) => (
            <Card key={outcome.title}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <outcome.icon className="h-5 w-5 text-sky-300" />
                  {outcome.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm leading-relaxed text-slate-300">{outcome.body}</CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="pricing" className="grid gap-6 py-12 md:grid-cols-[1.1fr_1fr] md:items-start">
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-slate-50 sm:text-3xl">Simple pricing for remote engineering teams</h2>
          <p className="max-w-xl text-slate-300">
            One plan, one checkout, no seat math. Connect Slack, pay once, and start getting reliable thread recaps across your
            team.
          </p>
          <p className="text-sm text-slate-400">
            After checkout, set your Stripe Payment Link success URL to
            <code className="mx-1 rounded bg-slate-900 px-1 py-0.5 text-slate-300">/unlock?session_id={'{CHECKOUT_SESSION_ID}'}</code>
            so access is granted automatically.
          </p>
        </div>
        <PricingCard />
      </section>

      <section className="py-10">
        <h2 className="mb-6 text-2xl font-semibold text-slate-50 sm:text-3xl">FAQ</h2>
        <Card>
          <CardContent className="pt-2">
            <Accordion type="single" collapsible>
              <AccordionItem value="item-1">
                <AccordionTrigger>Does the bot read every Slack channel?</AccordionTrigger>
                <AccordionContent>
                  No. It only fetches the thread where it is mentioned, using your workspace bot token and Slack permissions.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>What does the summary include?</AccordionTrigger>
                <AccordionContent>
                  Each response contains a TL;DR plus decisions, blockers, and concrete action items with owners when available.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>How is access controlled after payment?</AccordionTrigger>
                <AccordionContent>
                  Paid access is gated by a secure HTTP-only cookie issued after Stripe confirms a completed checkout session.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
