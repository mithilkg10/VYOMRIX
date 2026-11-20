import { cookies } from "next/headers";
import { ConsoleShell } from "@/components/console/shell";
import { DEMO_COOKIE_NAME, verifyDemoSessionToken } from "@/lib/demo-session";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const store = await cookies();
  const isDemo = await verifyDemoSessionToken(store.get(DEMO_COOKIE_NAME)?.value).catch(() => false);
  return <ConsoleShell mode={isDemo ? "demo" : "owner"}>{children}</ConsoleShell>;
}
