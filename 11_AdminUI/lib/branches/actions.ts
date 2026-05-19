"use server";

import { revalidatePath } from "next/cache";
import { BranchSchema } from "./schema";
import { readBranches, writeBranches } from "./store";

export async function saveBranch(formData: FormData) {
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
  const state = await readBranches();
  state.branches = state.branches.filter((b) => b.id !== id);
  await writeBranches(state);
  revalidatePath("/branches");
}
