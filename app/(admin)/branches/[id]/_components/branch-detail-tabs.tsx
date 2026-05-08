"use client";

import { useState } from "react";
import { Building2, Users, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/branches/schema";
import { OverviewPanel } from "./overview-panel";
import { StaffPanel } from "./staff-panel";
import { CommsPanel } from "./comms-panel";

const TABS = [
  { id: "overview", label: "Overview", icon: Building2 },
  { id: "staff", label: "Staff & Attendance", icon: Users },
  { id: "comms", label: "Communication", icon: MessageSquare },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function BranchDetailTabs({ branch }: { branch: Branch }) {
  const [active, setActive] = useState<TabId>("overview");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors",
                active === tab.id
                  ? "border-brand-green text-brand-green-deep"
                  : "border-transparent text-muted hover:text-foreground"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Panels */}
      {active === "overview" && <OverviewPanel branch={branch} />}
      {active === "staff" && <StaffPanel branch={branch} />}
      {active === "comms" && <CommsPanel branch={branch} />}
    </div>
  );
}
