"use client";

import { ShoppingBag, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { Branch } from "@/lib/branches/schema";

/**
 * App Orders Tab - Skeleton for order tracking per branch.
 * Will integrate with delivery/ordering API once connected.
 */
export function OrdersTab({ branches }: { branches: Branch[] }) {
  const activeBranches = branches.filter((b) => b.status === "active");

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ShoppingBag className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Today&apos;s Orders</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-brand-yellow/20 flex items-center justify-center">
              <Clock className="size-5 text-brand-ink" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Pending</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="size-10 rounded-lg bg-brand-green/10 flex items-center justify-center">
              <CheckCircle2 className="size-5 text-brand-green" />
            </div>
            <div>
              <p className="text-xs text-muted uppercase tracking-wider">Completed</p>
              <p className="text-2xl font-bold">—</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Per-branch order list (placeholder) */}
      <Card>
        <CardBody className="py-12 text-center">
          <ShoppingBag className="size-10 mx-auto mb-3 opacity-20" />
          <h3 className="font-medium text-sm">App Orders</h3>
          <p className="text-xs text-muted mt-1 max-w-md mx-auto">
            Connect your ordering API endpoint in{" "}
            <span className="font-medium">Settings → API Management</span>{" "}
            to start tracking live orders from {activeBranches.length > 0 ? activeBranches.length : branches.length} kiosk{branches.length !== 1 && "s"}.
          </p>
          <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted">
            <AlertCircle className="size-3.5" />
            No ordering API configured yet
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
