"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import { Settings, Globe, Bell, Lock, User, Save } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Settings as SettingsType } from "@/lib/settings/schema";
import { saveSettings } from "@/lib/settings/actions";

function SectionHeader({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}) {
  return (
    <div className="flex items-start gap-3 mb-5">
      <div className="size-10 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
        <Icon className="size-5 text-brand-green" />
      </div>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="text-xs text-muted mt-0.5">{description}</p>
      </div>
    </div>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border last:border-0 gap-4">
      <span className="text-sm font-medium shrink-0">{label}</span>
      <div className="flex-1 max-w-[260px]">{children}</div>
    </div>
  );
}

function Toggle({
  name,
  defaultChecked,
}: {
  name: string;
  defaultChecked: boolean;
}) {
  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <div className="relative w-10 h-5 bg-zinc-300 rounded-full peer-checked:bg-brand-green transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:size-4 after:bg-white after:rounded-full after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SettingsForm({ settings }: { settings: SettingsType }) {
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      await saveSettings(fd);
      toast.success("Settings saved");
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
      {/* Account */}
      <Card>
        <CardBody>
          <SectionHeader icon={User} title="Account" description="User profile and display name" />
          <FieldRow label="User">
            <Input name="userName" defaultValue={settings.userName} className="text-sm" />
          </FieldRow>
          <FieldRow label="Email">
            <Input name="email" type="email" defaultValue={settings.email} className="text-sm" />
          </FieldRow>
          <FieldRow label="Role">
            <span className="text-sm text-muted">Administrator</span>
          </FieldRow>
        </CardBody>
      </Card>

      {/* Localization */}
      <Card>
        <CardBody>
          <SectionHeader icon={Globe} title="Localization" description="Language and regional preferences" />
          <FieldRow label="Primary Language">
            <select
              name="primaryLanguage"
              defaultValue={settings.primaryLanguage}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option>English</option>
              <option>Arabic</option>
            </select>
          </FieldRow>
          <FieldRow label="Secondary Language">
            <select
              name="secondaryLanguage"
              defaultValue={settings.secondaryLanguage}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option>Arabic (Egyptian)</option>
              <option>English</option>
            </select>
          </FieldRow>
          <FieldRow label="Currency">
            <select
              name="currency"
              defaultValue={settings.currency}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="EGP">EGP (Egyptian Pound)</option>
              <option value="USD">USD (US Dollar)</option>
              <option value="EUR">EUR (Euro)</option>
            </select>
          </FieldRow>
          <FieldRow label="Timezone">
            <select
              name="timezone"
              defaultValue={settings.timezone}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="Africa/Cairo">Africa/Cairo (UTC+2)</option>
              <option value="UTC">UTC</option>
            </select>
          </FieldRow>
        </CardBody>
      </Card>

      {/* Notifications */}
      <Card>
        <CardBody>
          <SectionHeader icon={Bell} title="Notifications" description="Email and system alerts" />
          <FieldRow label="Menu Changes">
            <Toggle name="notifyMenuChanges" defaultChecked={settings.notifyMenuChanges} />
          </FieldRow>
          <FieldRow label="Video Status Updates">
            <Toggle name="notifyVideoUpdates" defaultChecked={settings.notifyVideoUpdates} />
          </FieldRow>
          <FieldRow label="System Maintenance">
            <Toggle name="notifyMaintenance" defaultChecked={settings.notifyMaintenance} />
          </FieldRow>
        </CardBody>
      </Card>

      {/* Security */}
      <Card>
        <CardBody>
          <SectionHeader icon={Lock} title="Security" description="Access control and session settings" />
          <FieldRow label="Session Timeout">
            <select
              name="sessionTimeout"
              defaultValue={settings.sessionTimeout}
              className="w-full text-sm border border-border rounded-md px-2 py-1.5 bg-white"
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="120">2 hours</option>
            </select>
          </FieldRow>
          <FieldRow label="Two-Factor Auth">
            <span className="text-sm text-muted">Not configured</span>
          </FieldRow>
          <FieldRow label="API Access">
            <span className="text-sm text-muted">Disabled</span>
          </FieldRow>
        </CardBody>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={pending} className="flex items-center gap-2">
          <Save className="size-4" />
          {pending ? "Saving…" : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
