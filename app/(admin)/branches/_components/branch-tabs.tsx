"use client";

import { useState } from "react";
import { MapPin, ShoppingBag, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Branch } from "@/lib/branches/schema";
import { LocationsTab } from "./locations-tab";
import { OrdersTab } from "./orders-tab";
import { CashTab } from "./cash-tab";

type Tab = "locations" | "orders" | "cash";

const TABS: { id: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "locations", label: "Locations", icon: MapPin },
  { id: "orders", label: "App Orders", icon: ShoppingBag },
  { id: "cash", label: "Cash Tracking", icon: DollarSign },
];

export function BranchTabs({ branches }: { branches: Branch[] }) {
  const [active, setActive] = useState<Tab>("locations");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-border mb-6">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActive(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px",
                active === tab.id
                  ? "border-brand-green text-brand-green-deep"
                  : "border-transparent text-muted hover:text-foreground hover:border-border"
              )}
            >
              <Icon className="size-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {active === "locations" && <LocationsTab branches={branches} />}
      {active === "orders" && <OrdersTab branches={branches} />}
      {active === "cash" && <CashTab branches={branches} />}
    </div>
  );
}
