import { UnderDevelopment } from "@/components/ui/under-development";

export default function SettingsPage() {
  return <UnderDevelopment title="Platform Settings" description="Configure integrations, access policies, notifications, and platform-wide security controls." plannedCapabilities={["Identity, role, and permission administration", "Integration and notification configuration", "Platform policy and retention controls"]} />;
}
