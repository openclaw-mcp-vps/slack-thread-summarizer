import { Check } from "lucide-react";

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const features = [
  "Unlimited Slack thread summaries",
  "Bot mentions with instant TL;DR replies",
  "Decision and action-item extraction",
  "Usage analytics in dashboard",
  "Priority support for engineering managers",
];

export function PricingCard() {
  return (
    <Card className="relative overflow-hidden border-sky-500/35 bg-slate-900">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400 to-transparent" />
      <CardHeader>
        <CardTitle>Thread Summarizer Pro</CardTitle>
        <CardDescription>For remote teams that need decisions fast, not after 200 unread messages.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-slate-50">$15</span>
          <span className="text-slate-400">per month</span>
        </div>
        <ul className="space-y-3">
          {features.map((feature) => (
            <li key={feature} className="flex items-start gap-3 text-sm text-slate-200">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <a
          href={process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK ?? ""}
          target="_blank"
          rel="noreferrer"
          className="w-full"
          aria-label="Buy Thread Summarizer Pro"
        >
          <Button size="lg" className="w-full">
            Buy with Stripe Checkout
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
