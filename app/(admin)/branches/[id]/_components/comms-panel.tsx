"use client";

import { useState } from "react";
import {
  MessageSquare,
  Radio,
  Plug,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Branch } from "@/lib/branches/schema";

/**
 * Communication panel — embed-ready for Slack, Rocket.Chat, Mattermost,
 * or any embeddable chat/messaging API.
 *
 * Planned flow:
 * 1. Owner sets embed URL per branch in Settings or inline here
 * 2. iframe renders the real-time channel
 * 3. Kiosk-side device connects to same channel → instant reach
 */

const INTEGRATIONS = [
  {
    id: "slack",
    name: "Slack",
    description: "Embed a Slack channel for real-time messaging with kiosk staff",
    icon: "💬",
    docsUrl: "https://api.slack.com/messaging/webhooks",
  },
  {
    id: "rocketchat",
    name: "Rocket.Chat",
    description: "Self-hosted open-source chat — full control, embeddable widget",
    icon: "🚀",
    docsUrl: "https://developer.rocket.chat/",
  },
  {
    id: "custom",
    name: "Custom Embed",
    description: "Any embeddable iframe-compatible messaging or intercom system",
    icon: "🔌",
    docsUrl: null,
  },
];

export function CommsPanel({ branch }: { branch: Branch }) {
  const [embedUrl, setEmbedUrl] = useState("");
  const [activeEmbed, setActiveEmbed] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* Status bar */}
      <Card>
        <CardBody className="flex items-center gap-3 py-3">
          <div className="size-9 rounded-lg bg-brand-green/10 flex items-center justify-center">
            <Radio className="size-4 text-brand-green" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">
              Communication Channel — {branch.name}
            </p>
            <p className="text-[11px] text-muted">
              Real-time link between admin dashboard and kiosk terminal
            </p>
          </div>
          <span className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-zinc-100 text-zinc-500">
            Not Connected
          </span>
        </CardBody>
      </Card>

      {/* Available integrations */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Available Integrations</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INTEGRATIONS.map((int) => (
            <Card key={int.id} className="hover:border-brand-green/30 transition-colors cursor-pointer">
              <CardBody className="text-center py-5">
                <div className="text-2xl mb-2">{int.icon}</div>
                <p className="text-sm font-medium">{int.name}</p>
                <p className="text-[11px] text-muted mt-1">{int.description}</p>
                {int.docsUrl && (
                  <a
                    href={int.docsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-brand-green mt-2 hover:underline"
                  >
                    <ExternalLink className="size-3" />
                    Docs
                  </a>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      </div>

      {/* Embed configuration */}
      <Card>
        <CardBody>
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Plug className="size-4" />
            Embed Channel
          </h3>
          <p className="text-xs text-muted mb-4">
            Paste the embed URL from your messaging provider. The channel will render below
            and connect this admin view to the kiosk-side terminal.
          </p>
          <div className="flex gap-2">
            <Input
              value={embedUrl}
              onChange={(e) => setEmbedUrl(e.target.value)}
              placeholder="https://your-chat-provider.com/embed/channel-id"
              className="text-sm flex-1"
            />
            <Button
              size="sm"
              onClick={() => setActiveEmbed(embedUrl.trim() || null)}
              disabled={!embedUrl.trim()}
            >
              Connect
            </Button>
          </div>

          {/* Embed iframe */}
          {activeEmbed && (
            <div className="mt-4 rounded-lg border border-border overflow-hidden">
              <div className="bg-surface-muted px-3 py-2 flex items-center gap-2 border-b border-border">
                <MessageSquare className="size-3.5 text-brand-green" />
                <span className="text-xs font-medium">Live Channel</span>
                <button
                  onClick={() => setActiveEmbed(null)}
                  className="ml-auto text-[10px] text-muted hover:text-red-500"
                >
                  Disconnect
                </button>
              </div>
              <iframe
                src={activeEmbed}
                title={`Communication channel for ${branch.name}`}
                className="w-full h-[400px] border-0"
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              />
            </div>
          )}

          {!activeEmbed && (
            <div className="mt-4 p-6 rounded-lg border border-dashed border-border text-center">
              <MessageSquare className="size-8 mx-auto text-muted/40 mb-2" />
              <p className="text-xs text-muted">
                No channel connected. Enter an embed URL above to activate real-time communication.
              </p>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Future notice */}
      <div className="p-3 rounded-lg bg-blue-50/50 border border-blue-200/50 flex items-start gap-2">
        <AlertCircle className="size-4 text-blue-600 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-800">
          <p className="font-medium">Coming Soon: Push Notifications & Voice</p>
          <p className="mt-0.5 text-blue-700">
            Future integration will include push notifications to kiosk tablets,
            voice intercom (WebRTC), and message history with audit trail.
          </p>
        </div>
      </div>
    </div>
  );
}
