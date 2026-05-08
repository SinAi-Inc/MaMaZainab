"use server";

import { revalidatePath } from "next/cache";
import { SettingsSchema } from "./schema";
import { writeSettings } from "./store";

export async function saveSettings(formData: FormData) {
  const raw = {
    userName: formData.get("userName"),
    email: formData.get("email"),
    primaryLanguage: formData.get("primaryLanguage"),
    secondaryLanguage: formData.get("secondaryLanguage"),
    currency: formData.get("currency"),
    timezone: formData.get("timezone"),
    notifyMenuChanges: formData.get("notifyMenuChanges") === "on",
    notifyVideoUpdates: formData.get("notifyVideoUpdates") === "on",
    notifyMaintenance: formData.get("notifyMaintenance") === "on",
    nvidiaApiKey: formData.get("nvidiaApiKey") ?? "",
    sessionTimeout: formData.get("sessionTimeout"),
  };

  const parsed = SettingsSchema.parse(raw);
  await writeSettings(parsed);
  revalidatePath("/settings");
}
