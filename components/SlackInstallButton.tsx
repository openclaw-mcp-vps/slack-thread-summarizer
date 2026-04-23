import { Slack } from "lucide-react";

import { Button } from "@/components/ui/button";

export function SlackInstallButton() {
  return (
    <a href="/api/slack/install" aria-label="Install Summarize Threads in Slack">
      <Button variant="secondary" size="lg" className="w-full sm:w-auto">
        <Slack className="h-4 w-4" />
        Connect Slack Workspace
      </Button>
    </a>
  );
}
