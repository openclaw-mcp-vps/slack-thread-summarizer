import Link from "next/link";
import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UnlockPageProps = {
  searchParams?: Promise<{
    session_id?: string;
  }>;
};

export default async function UnlockPage({ searchParams }: UnlockPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const sessionId = resolvedSearchParams?.session_id;

  if (sessionId) {
    redirect(`/api/paywall/unlock?session_id=${encodeURIComponent(sessionId)}`);
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Waiting for Stripe session</CardTitle>
          <CardDescription>
            Open this page using your Stripe success URL with a valid <code>session_id</code> query parameter.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link href="/dashboard" className="text-sm text-sky-300 hover:text-sky-200">
            Return to dashboard
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
