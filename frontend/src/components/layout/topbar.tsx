"use client";

import { Bell, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/system/data-display";
import { CommandPalette, ThemeToggle, openCommandPalette } from "@/components/system/overlays";
import Link from "next/link";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6"><Button variant="ghost" size="icon-sm" className="lg:hidden" onClick={onMenu} aria-label="Open navigation"><Menu /></Button><div className="hidden max-w-md flex-1 lg:block"><SearchInput label="Search platform data" placeholder="Search alerts, incidents, IPs…" readOnly onFocus={(event) => { event.currentTarget.blur(); openCommandPalette(); }} onClick={openCommandPalette} className="cursor-pointer" /></div><div className="ml-auto flex items-center gap-1"><CommandPalette /><ThemeToggle /><Button variant="ghost" size="icon-sm" className="relative" render={<Link href="/notifications" aria-label="View notifications"><Bell /></Link>} /></div></header>;
}
