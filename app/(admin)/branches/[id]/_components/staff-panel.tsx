"use client";

import {
  Users,
  UserPlus,
  CalendarCheck,
  Clock,
  AlertCircle,
} from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { Branch } from "@/lib/branches/schema";

/**
 * Staff & Attendance panel — skeleton ready for future API integration.
 * Will connect to a scheduling/attendance system (e.g., Deputy, Homebase, or custom).
 */
export function StaffPanel({ branch }: { branch: Branch }) {
  // Placeholder data — will be replaced by real API
  const placeholderStaff = [
    { name: branch.manager || "Manager TBD", role: "Shift Manager", status: "on-shift" },
    { name: "Staff Member 1", role: "Cashier", status: "on-shift" },
    { name: "Staff Member 2", role: "Kitchen", status: "off-today" },
  ];

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card>
          <CardBody className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-lg bg-brand-green/10 flex items-center justify-center">
              <Users className="size-4 text-brand-green" />
            </div>
            <div>
              <p className="text-lg font-semibold">—</p>
              <p className="text-[11px] text-muted">Total Staff</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-lg bg-blue-50 flex items-center justify-center">
              <CalendarCheck className="size-4 text-blue-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">—</p>
              <p className="text-[11px] text-muted">On Shift Now</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-3">
            <div className="size-9 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="size-4 text-amber-600" />
            </div>
            <div>
              <p className="text-lg font-semibold">—</p>
              <p className="text-[11px] text-muted">Avg Hours / Week</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Staff list skeleton */}
      <Card>
        <CardBody>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">Staff Roster</h3>
            <button className="inline-flex items-center gap-1.5 text-xs text-brand-green hover:text-brand-green-deep transition-colors font-medium">
              <UserPlus className="size-3.5" />
              Add Staff
            </button>
          </div>

          <div className="divide-y divide-border">
            {placeholderStaff.map((s, i) => (
              <div key={i} className="flex items-center gap-3 py-3">
                <div className="size-8 rounded-full bg-surface-muted flex items-center justify-center text-xs font-medium text-muted">
                  {s.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[11px] text-muted">{s.role}</p>
                </div>
                <span
                  className={`px-2 py-0.5 text-[10px] rounded-full font-medium ${
                    s.status === "on-shift"
                      ? "bg-brand-green/15 text-brand-green-deep"
                      : "bg-zinc-100 text-zinc-500"
                  }`}
                >
                  {s.status === "on-shift" ? "On Shift" : "Off Today"}
                </span>
              </div>
            ))}
          </div>

          {/* Integration notice */}
          <div className="mt-4 p-3 rounded-lg bg-amber-50/50 border border-amber-200/50 flex items-start gap-2">
            <AlertCircle className="size-4 text-amber-600 mt-0.5 shrink-0" />
            <div className="text-xs text-amber-800">
              <p className="font-medium">Attendance API not connected</p>
              <p className="mt-0.5 text-amber-700">
                Connect a scheduling provider (Deputy, Homebase, or custom endpoint)
                in Settings → API Management to enable real-time attendance tracking.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
