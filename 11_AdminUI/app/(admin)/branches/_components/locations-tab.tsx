"use client";

import { useTransition, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, MapPin, Phone, Clock, User, ChevronRight } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Branch, BranchStatus } from "@/lib/branches/schema";
import { STATUS_META } from "@/lib/branches/schema";
import { saveBranch, deleteBranch } from "@/lib/branches/actions";

function StatusBadge({ status }: { status: BranchStatus }) {
  const meta = STATUS_META[status];
  const tones = {
    success: "bg-brand-green/15 text-brand-green-deep",
    warning: "bg-brand-yellow/30 text-brand-ink",
    neutral: "bg-zinc-200 text-zinc-700",
    info: "bg-blue-100 text-blue-700",
    error: "bg-red-100 text-red-700",
  };
  return (
    <span className={cn("px-2 py-0.5 text-[11px] font-medium rounded-full", tones[meta.tone])}>
      {meta.label}
    </span>
  );
}

function BranchCard({ branch, onEdit }: { branch: Branch; onEdit: (b: Branch) => void }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete "${branch.name}"?`)) return;
    startTransition(async () => {
      await deleteBranch(branch.id);
      router.refresh();
      toast.success(`${branch.name} deleted`);
    });
  }

  return (
    <Card className="group hover:border-brand-green/40 transition-colors">
      <CardBody className="flex items-start gap-4">
        <Link href={`/branches/${branch.id}`} className="flex items-start gap-4 flex-1 min-w-0">
          <div className="size-12 rounded-xl bg-brand-green/10 flex items-center justify-center shrink-0">
            <MapPin className="size-5 text-brand-green" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">{branch.name}</h3>
              <StatusBadge status={branch.status} />
              <span className="text-[10px] text-muted ml-auto">Kiosk #{branch.kioskNumber}</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
              {branch.district && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {branch.district}, {branch.city}
                </span>
              )}
              {!branch.district && (
                <span className="flex items-center gap-1">
                  <MapPin className="size-3" /> {branch.city}
                </span>
              )}
              {branch.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="size-3" /> {branch.phone}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock className="size-3" /> {branch.openHours}
              </span>
              {branch.manager && (
                <span className="flex items-center gap-1">
                  <User className="size-3" /> {branch.manager}
                </span>
              )}
            </div>
            {branch.notes && (
              <p className="text-xs text-muted mt-2 italic">{branch.notes}</p>
            )}
          </div>
          <ChevronRight className="size-4 text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-4" />
        </Link>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onEdit(branch)}
            className="size-8 rounded-md flex items-center justify-center hover:bg-surface-muted transition-colors"
            title="Edit"
          >
            <Pencil className="size-3.5 text-muted" />
          </button>
          <button
            onClick={handleDelete}
            disabled={pending}
            className="size-8 rounded-md flex items-center justify-center hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <Trash2 className="size-3.5 text-red-500" />
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

function BranchForm({
  branch,
  onClose,
}: {
  branch: Branch | null;
  onClose: () => void;
}) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  const isNew = !branch;
  const defaults: Branch = branch ?? {
    id: `kiosk-${Date.now()}`,
    kioskNumber: 1,
    name: "",
    city: "Alexandria",
    district: "",
    address: "",
    phone: "",
    manager: "",
    status: "construction",
    openHours: "09:00–23:00",
    seating: 0,
    notes: "",
    lat: "",
    lng: "",
    partnerType: "",
    priority: "prospect",
    footfallEstimate: "",
    recommendedFormat: "",
    commercialModel: "",
    showInPartnerPortal: true,
  };

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      await saveBranch(fd);
      router.refresh();
      toast.success(isNew ? "Branch added" : "Branch updated");
      onClose();
    });
  }

  return (
    <Card className="border-brand-green/30">
      <CardBody>
        <h3 className="font-semibold mb-4">{isNew ? "Add New Branch" : `Edit: ${defaults.name}`}</h3>
        <form ref={formRef} onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
          <input type="hidden" name="id" value={defaults.id} />

          <div>
            <label className="text-xs font-medium text-muted">Name *</label>
            <Input name="name" defaultValue={defaults.name} required className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Kiosk #</label>
            <Input name="kioskNumber" type="number" defaultValue={defaults.kioskNumber} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">City</label>
            <Input name="city" defaultValue={defaults.city} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">District</label>
            <Input name="district" defaultValue={defaults.district} className="text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted">Address</label>
            <Input name="address" defaultValue={defaults.address} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Phone</label>
            <Input name="phone" defaultValue={defaults.phone} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Manager</label>
            <Input name="manager" defaultValue={defaults.manager} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Status</label>
            <select
              name="status"
              defaultValue={defaults.status}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="active">Active</option>
              <option value="construction">Construction</option>
              <option value="paused">Paused</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Open Hours</label>
            <Input name="openHours" defaultValue={defaults.openHours} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Seating</label>
            <Input name="seating" type="number" defaultValue={defaults.seating} className="text-sm" />
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted">Notes</label>
            <Input name="notes" defaultValue={defaults.notes} className="text-sm" />
          </div>
          <div className="col-span-2 border-t border-border pt-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">
              Partner Portal Map Pin
            </p>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Latitude</label>
            <Input name="lat" type="number" step="any" defaultValue={defaults.lat} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Longitude</label>
            <Input name="lng" type="number" step="any" defaultValue={defaults.lng} className="text-sm" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Partner Type</label>
            <select
              name="partnerType"
              defaultValue={defaults.partnerType}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">Unset</option>
              <option value="mall">Mall</option>
              <option value="club">Club</option>
              <option value="hypermarket">Hypermarket</option>
              <option value="cinema">Cinema</option>
              <option value="university">University</option>
              <option value="petrol_station">Petrol Station</option>
              <option value="compound">Compound</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Priority</label>
            <select
              name="priority"
              defaultValue={defaults.priority}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="confirmed">Confirmed</option>
              <option value="target">Target</option>
              <option value="prospect">Prospect</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Recommended Format</label>
            <select
              name="recommendedFormat"
              defaultValue={defaults.recommendedFormat}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">Unset</option>
              <option value="kiosk">Kiosk</option>
              <option value="corner">Corner</option>
              <option value="cart">Cart</option>
              <option value="inline">Inline</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted">Commercial Model</label>
            <select
              name="commercialModel"
              defaultValue={defaults.commercialModel}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="">Unset</option>
              <option value="fixed_rent">Fixed Rent</option>
              <option value="revenue_share">Revenue Share</option>
              <option value="minimum_guarantee">Minimum Guarantee</option>
              <option value="pilot">Pilot</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs font-medium text-muted">Footfall Estimate</label>
            <Input name="footfallEstimate" defaultValue={defaults.footfallEstimate} className="text-sm" />
          </div>
          <label className="col-span-2 flex items-center gap-2 text-xs font-medium text-muted">
            <input
              type="checkbox"
              name="showInPartnerPortal"
              defaultChecked={defaults.showInPartnerPortal}
              className="accent-brand-green"
            />
            Show in partner portal map and location list
          </label>
          <div className="col-span-2 flex gap-2 justify-end pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isNew ? "Add Branch" : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function LocationsTab({ branches }: { branches: Branch[] }) {
  const [editing, setEditing] = useState<Branch | null | "new">(null);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{branches.length} kiosk location{branches.length !== 1 && "s"}</p>
        <Button onClick={() => setEditing("new")} size="sm">
          <Plus className="size-4 mr-1.5" />
          Add Location
        </Button>
      </div>

      {editing !== null && (
        <BranchForm
          branch={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}

      <div className="grid gap-3">
        {branches.map((b) => (
          <BranchCard key={b.id} branch={b} onEdit={setEditing} />
        ))}
        {branches.length === 0 && !editing && (
          <Card>
            <CardBody className="py-12 text-center text-muted">
              <MapPin className="size-10 mx-auto mb-3 opacity-30" />
              <p>No locations yet. Add your first kiosk.</p>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
