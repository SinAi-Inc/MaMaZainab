"use client";

import { useTransition, useRef } from "react";
import { toast } from "sonner";
import { Settings, Globe, Bell, Lock, Shield, User, Save, Plug, Share2, LogOut } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { Settings as SettingsType } from "@/lib/settings/schema";
import { SESSION_TIMEOUT_MINUTES, SESSION_TIMEOUT_SETTING } from "@/lib/session-limits";
import { saveSettings, terminateOtherSessions } from "@/lib/settings/actions";

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
        aria-label={name}
        defaultChecked={defaultChecked}
        className="sr-only peer"
      />
      <div className="relative w-10 h-5 bg-zinc-300 rounded-full peer-checked:bg-brand-green transition-colors after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:size-4 after:bg-white after:rounded-full after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export function SettingsForm({ settings }: { settings: SettingsType }) {
  const [pending, startTransition] = useTransition();
  const [terminating, startTerminate] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const fd = new FormData(formRef.current!);
    startTransition(async () => {
      await saveSettings(fd);
      toast.success("Settings saved");
    });
  }

  function handleTerminateSessions() {
    startTerminate(async () => {
      const result = await terminateOtherSessions();
      if (result.ok) {
        toast.success("All other sessions have been ended");
      } else {
        toast.error(result.error ?? "Failed to end sessions");
      }
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
              title="Primary Language"
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
              title="Secondary Language"
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
              title="Currency"
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
              title="Timezone"
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

      {/* API Management */}
      <Card>
        <CardBody>
          <SectionHeader icon={Plug} title="API Management" description="Connect external services for orders, POS, and delivery" />
          <FieldRow label="Ordering API">
            <div className="flex items-center gap-2">
              <Input
                name="orderingApiUrl"
                defaultValue={settings.orderingApiUrl}
                placeholder="https://api.example.com/orders"
                className="text-sm flex-1"
              />
              <Toggle name="orderingApiEnabled" defaultChecked={settings.orderingApiEnabled} />
            </div>
          </FieldRow>
          <FieldRow label="POS System">
            <div className="flex items-center gap-2">
              <Input
                name="posApiUrl"
                defaultValue={settings.posApiUrl}
                placeholder="https://pos.example.com/api"
                className="text-sm flex-1"
              />
              <Toggle name="posApiEnabled" defaultChecked={settings.posApiEnabled} />
            </div>
          </FieldRow>
          <FieldRow label="Delivery API">
            <div className="flex items-center gap-2">
              <Input
                name="deliveryApiUrl"
                defaultValue={settings.deliveryApiUrl}
                placeholder="https://delivery.example.com/v1"
                className="text-sm flex-1"
              />
              <Toggle name="deliveryApiEnabled" defaultChecked={settings.deliveryApiEnabled} />
            </div>
          </FieldRow>
        </CardBody>
      </Card>

      {/* Social Media */}
      <Card>
        <CardBody>
          <SectionHeader icon={Share2} title="Social Media" description="Links shown on website, coming-soon page, and all public-facing surfaces" />
          <FieldRow label="Facebook">
            <Input name="socialFacebook" defaultValue={settings.socialFacebook} placeholder="https://facebook.com/mamazainab" className="text-sm" />
          </FieldRow>
          <FieldRow label="Instagram">
            <Input name="socialInstagram" defaultValue={settings.socialInstagram} placeholder="https://instagram.com/mamazainab" className="text-sm" />
          </FieldRow>
          <FieldRow label="TikTok">
            <Input name="socialTiktok" defaultValue={settings.socialTiktok} placeholder="https://tiktok.com/@mamazainab" className="text-sm" />
          </FieldRow>
          <FieldRow label="X / Twitter">
            <Input name="socialTwitter" defaultValue={settings.socialTwitter} placeholder="https://x.com/mamazainab" className="text-sm" />
          </FieldRow>
          <FieldRow label="YouTube">
            <Input name="socialYoutube" defaultValue={settings.socialYoutube} placeholder="https://youtube.com/@mamazainab" className="text-sm" />
          </FieldRow>
          <FieldRow label="WhatsApp">
            <Input name="socialWhatsapp" defaultValue={settings.socialWhatsapp} placeholder="https://wa.me/201234567890" className="text-sm" />
          </FieldRow>
        </CardBody>
      </Card>

      {/* Security */}
      <Card>
        <CardBody>
          <SectionHeader icon={Shield} title="Security" description="Access control, password, and privacy settings" />
          <FieldRow label="Session Timeout">
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm">
              <input type="hidden" name="sessionTimeout" value={SESSION_TIMEOUT_SETTING} />
              <span className="font-medium text-brand-ink">
                {SESSION_TIMEOUT_MINUTES} minutes
              </span>
              <p className="mt-0.5 text-xs text-muted">
                Hard limit for admin and partner sessions.
              </p>
            </div>
          </FieldRow>
          <FieldRow label="Require Password">
            <Toggle name="requirePassword" defaultChecked={settings.requirePassword} />
          </FieldRow>
          <FieldRow label="Admin Password">
            <Input
              name="adminPassword"
              type="password"
              defaultValue={settings.adminPassword}
              placeholder="Set admin passcode"
              className="text-sm"
            />
          </FieldRow>
          <FieldRow label="Public Menu Access">
            <Toggle name="allowPublicMenu" defaultChecked={settings.allowPublicMenu} />
          </FieldRow>

          {/* End other sessions */}
          <div className="pt-4 mt-3 border-t border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">End All Other Sessions</p>
                <p className="text-xs text-muted mt-0.5">
                  Sign out every device &amp; browser except this one.
                </p>
              </div>
              <Button
                type="button"
                variant="danger"
                size="sm"
                disabled={terminating}
                onClick={handleTerminateSessions}
                className="flex items-center gap-1.5 shrink-0"
              >
                <LogOut className="size-3.5" />
                {terminating ? "Ending…" : "End Sessions"}
              </Button>
            </div>
          </div>
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
