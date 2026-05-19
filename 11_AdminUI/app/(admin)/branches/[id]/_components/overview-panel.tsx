"use client";

import { MapPin, Phone, Clock, User, Armchair, FileText } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import type { Branch } from "@/lib/branches/schema";

export function OverviewPanel({ branch }: { branch: Branch }) {
  const details = [
    { icon: MapPin, label: "Address", value: branch.address || "—" },
    { icon: MapPin, label: "District", value: branch.district || "—" },
    { icon: MapPin, label: "City", value: branch.city },
    { icon: Phone, label: "Phone", value: branch.phone || "—" },
    { icon: User, label: "Manager", value: branch.manager || "—" },
    { icon: Clock, label: "Open Hours", value: branch.openHours },
    { icon: Armchair, label: "Seating", value: branch.seating ? `${branch.seating} seats` : "—" },
    { icon: FileText, label: "Notes", value: branch.notes || "—" },
  ];

  return (
    <Card>
      <CardBody>
        <h3 className="font-semibold text-sm mb-4">Location Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {details.map((d) => {
            const Icon = d.icon;
            return (
              <div key={d.label} className="flex items-start gap-3">
                <Icon className="size-4 text-muted mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted">{d.label}</p>
                  <p className="text-sm">{d.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </CardBody>
    </Card>
  );
}
