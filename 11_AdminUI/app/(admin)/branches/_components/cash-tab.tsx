"use client";

import { DollarSign, TrendingUp, Banknote, AlertCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { Branch } from "@/lib/branches/schema";

/**
 * Cash Tracking Tab — Skeleton for daily cash reconciliation per kiosk.
 * Will integrate with POS/cash management system once connected.
 */
export function CashTab({ branches }: { branches: Branch[] }) {
  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
              <DollarSign className="size-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Today&apos;s Revenue</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Banknote className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Cash on Hand</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
              <TrendingUp className="size-5 text-brand-ink" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">7-Day Avg</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Per-branch cash log (placeholder) */}
      <Card>
        <CardBody className="py-12 text-center">
          <Banknote className="size-10 mx-auto mb-3 opacity-20" />
          <h3 className="font-medium text-sm">Cash Tracking Dashboard</h3>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto">
            Connect your POS system in{" "}
            <span className="font-medium">Settings → API Management</span>{" "}
            to track daily cash flow across {branches.length} kiosk{branches.length !== 1 && "s"}.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <AlertCircle className="size-3.5" />
            No POS integration configured yet
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
