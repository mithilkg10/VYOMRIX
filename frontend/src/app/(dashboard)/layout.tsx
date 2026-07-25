"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [navigationOpen, setNavigationOpen] = useState(false);
  return <div className="flex min-h-dvh bg-muted/35"><a href="#main-content" className="sr-only z-[60] rounded-md bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:absolute focus:left-4 focus:top-4">Skip to content</a><Sidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} /><div className="min-w-0 flex-1"><Topbar onMenu={() => setNavigationOpen(true)} /><main id="main-content" className="min-h-[calc(100dvh-4rem)]">{children}</main></div></div>;
}
