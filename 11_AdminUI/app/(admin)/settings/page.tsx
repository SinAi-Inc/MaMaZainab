import { Settings as SettingsIcon } from "lucide-react";
import { readSettings } from "@/lib/settings/store";
import { SettingsForm } from "./_components/settings-form";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await readSettings();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">System Configuration</p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <SettingsIcon className="size-5 text-brand-green-deep" />
          Settings
        </h2>
        <p className="text-sm text-muted mt-1">
          Configure account, localization, notifications, and security preferences.
        </p>
      </div>

      <SettingsForm settings={settings} />
    </div>
  );
}
