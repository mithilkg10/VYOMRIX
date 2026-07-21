"use client";

import { Bell, Search, Command } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Topbar() {
  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6 lg:h-[60px]">
      <div className="w-full flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search alerts, incidents, IPs..."
            className="w-full appearance-none bg-background pl-8 shadow-none"
          />
          <div className="absolute right-2.5 top-2.5 hidden items-center gap-1 sm:flex">
            <Command className="h-3 w-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">K</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 hover:bg-accent text-muted-foreground">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-destructive"></span>
        </button>
      </div>
    </header>
  );
}
