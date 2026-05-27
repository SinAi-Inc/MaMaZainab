"use server";

import { revalidatePath } from "next/cache";
import { requireAdminAction } from "@/lib/server-action-auth";
import { BranchSchema } from "./schema";
import { readBranches, writeBranches } from "./store";

export async function saveBranch(formData: FormData) {
  await requireAdminAction();
  const raw = {
    id:          formData.get("id"),
    kioskNumber: formData.get("kioskNumber"),
    name:        formData.get("name"),
    city:        formData.get("city"),
    district:    formData.get("district"),
    address:     formData.get("address"),
    phone:       formData.get("phone"),
    manager:     formData.get("manager"),
    status:      formData.get("status"),
    openHours:   formData.get("openHours"),
    seating:     formData.get("seating"),
    notes:       formData.get("notes"),
    lat:          formData.get("lat") || undefined,
    lng:          formData.get("lng") || undefined,
    partnerType: formData.get("partnerType") || "",
    priority:    formData.get("priority") || "prospect",
    footfallEstimate: formData.get("footfallEstimate"),
    recommendedFormat: formData.get("recommendedFormat") || "",
    commercialModel: formData.get("commercialModel") || "",
    showInPartnerPortal: formData.get("showInPartnerPortal") === "on",
  };

  const branch = BranchSchema.parse(raw);
  const state = await readBranches();
  const idx = state.branches.findIndex((b) => b.id === branch.id);
  if (idx >= 0) {
    state.branches[idx] = branch;
  } else {
    state.branches.push(branch);
  }
  await writeBranches(state);
  revalidatePath("/branches");
}

export async function deleteBranch(id: string) {
  await requireAdminAction();
  const state = await readBranches();
  state.branches = state.branches.filter((b) => b.id !== id);
  await writeBranches(state);
  revalidatePath("/branches");
}
