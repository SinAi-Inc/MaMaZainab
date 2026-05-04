import { Settings as SettingsIcon, User, Globe, Bell, Lock } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";

type SettingSection = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  fields: {
    label: string;
    value: string;
    type: "text" | "toggle" | "select";
  }[];
};

const SECTIONS: SettingSection[] = [
  {
    name: "Account",
    description: "User profile and authentication settings",
    icon: User,
    fields: [
      { label: "User", value: "HITL Admin", type: "text" },
      { label: "Email", value: "hello@mamazainab.com", type: "text" },
      { label: "Role", value: "Administrator", type: "text" },
    ],
  },
  {
    name: "Localization",
    description: "Language and regional preferences",
    icon: Globe,
    fields: [
      { label: "Primary Language", value: "English", type: "select" },
      { label: "Secondary Language", value: "Arabic (Egyptian)", type: "select" },
      { label: "Currency", value: "EGP (Egyptian Pound)", type: "text" },
      { label: "Timezone", value: "Africa/Cairo (UTC+2)", type: "text" },
    ],
  },
  {
    name: "Notifications",
    description: "Email and system alerts",
    icon: Bell,
    fields: [
      { label: "Menu Changes", value: "Enabled", type: "toggle" },
      { label: "Video Status Updates", value: "Enabled", type: "toggle" },
      { label: "System Maintenance", value: "Enabled", type: "toggle" },
    ],
  },
  {
    name: "Security",
    description: "Access control and API keys",
    icon: Lock,
    fields: [
      { label: "Two-Factor Auth", value: "Not configured", type: "toggle" },
      { label: "API Access", value: "Disabled", type: "toggle" },
      { label: "Session Timeout", value: "30 minutes", type: "select" },
    ],
  },
];

function SettingField({
  label,
  value,
  type,
}: {
  label: string;
  value: string;
  type: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <span className="text-sm font-medium">{label}</span>
      <span className="text-sm text-muted">{value}</span>
    </div>
  );
}

function SettingCard({ section }: { section: SettingSection }) {
  const Icon = section.icon;
  return (
    <Card>
      <CardBody>
        <div className="flex items-start gap-3 mb-4">
          <div className="size-10 rounded-lg bg-brand-green/10 flex items-center justify-center flex-shrink-0">
            <Icon className="size-5 text-brand-green" />
          </div>
          <div>
            <h3 className="font-semibold">{section.name}</h3>
            <p className="text-xs text-muted mt-0.5">{section.description}</p>
          </div>
        </div>
        <div className="space-y-0">
          {section.fields.map((field) => (
            <SettingField key={field.label} {...field} />
          ))}
        </div>
      </CardBody>
    </Card>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted">
          System Configuration
        </p>
        <h2 className="text-2xl font-semibold mt-1 flex items-center gap-2">
          <SettingsIcon className="size-5 text-brand-green-deep" />
          Settings
        </h2>
        <p className="text-sm text-muted mt-1">
          Configure account, localization, notifications, and security
          preferences.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {SECTIONS.map((section) => (
          <SettingCard key={section.name} section={section} />
        ))}
      </div>

      <Card>
        <CardBody>
          <div className="text-center py-6">
            <SettingsIcon className="size-10 text-brand-green/30 mx-auto mb-3" />
            <h3 className="font-semibold text-lg mb-2">
              Settings Are Read-Only
            </h3>
            <p className="text-sm text-muted max-w-md mx-auto">
              This is a placeholder view. Full settings management including
              user roles, API key generation, and preferences will be
              implemented in the next phase.
            </p>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
