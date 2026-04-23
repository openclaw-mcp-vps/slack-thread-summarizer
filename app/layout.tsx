import type { Metadata } from "next";
import { Space_Grotesk, IBM_Plex_Mono } from "next/font/google";

import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://slack-thread-summarizer.example.com";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: "Slack Thread Summarizer | AI TL;DR for Busy Teams",
  description:
    "Summarize long Slack threads into decisions, blockers, and action items in seconds. Built for remote engineering teams.",
  keywords: [
    "Slack bot",
    "thread summary",
    "engineering productivity",
    "AI assistant",
    "remote teams",
  ],
  openGraph: {
    title: "Slack Thread Summarizer",
    description:
      "Mention the bot in any noisy Slack thread and get a clean TL;DR with decisions and next steps.",
    url: "/",
    siteName: "Slack Thread Summarizer",
    images: [
      {
        url: "/og-image.svg",
        width: 1200,
        height: 630,
        alt: "Slack Thread Summarizer",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Slack Thread Summarizer",
    description: "AI TL;DR summaries for long Slack threads.",
    images: ["/og-image.svg"],
  },
  alternates: {
    canonical: "/",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} antialiased`}>
        <div className="min-h-screen bg-[radial-gradient(circle_at_20%_-10%,rgba(56,189,248,0.2),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(14,165,233,0.16),transparent_30%),#0d1117]">
          {children}
        </div>
      </body>
    </html>
  );
}
