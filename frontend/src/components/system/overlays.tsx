"use client";

import { useEffect, useState } from "react";
import { Check, Command, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  return <Button variant="ghost" size="icon-sm" onClick={() => setTheme(nextTheme)} aria-label={"Switch to " + nextTheme + " theme"}>{resolvedTheme === "dark" ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}</Button>;
}

export function ConfirmationDialog({ trigger, title, description, confirmLabel = "Confirm", onConfirm }: { trigger: React.ReactElement; title: string; description: string; confirmLabel?: string; onConfirm: () => void }) {
  return <Dialog><DialogTrigger render={trigger} /><DialogContent><DialogHeader><DialogTitle>{title}</DialogTitle><DialogDescription>{description}</DialogDescription></DialogHeader><DialogFooter><DialogClose render={<Button variant="outline" />}>Cancel</DialogClose><Button variant="destructive" onClick={onConfirm}>{confirmLabel}</Button></DialogFooter></DialogContent></Dialog>;
}

export function Drawer({ trigger, title, children }: { trigger: React.ReactElement; title: string; children: React.ReactNode }) {
  return <Dialog><DialogTrigger render={trigger} /><DialogContent className="right-0 left-auto top-0 h-dvh max-w-md translate-x-0 translate-y-0 rounded-none border-y-0 border-r-0"><DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader><div className="overflow-y-auto">{children}</div></DialogContent></Dialog>;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  useEffect(() => { const listener = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); } }; window.addEventListener("keydown", listener); return () => window.removeEventListener("keydown", listener); }, []);
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground sm:inline-flex" aria-label="Open command palette"><Command className="h-4 w-4" aria-hidden="true" /><span>Search</span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd></Button>} /><DialogContent className="max-w-lg p-0"><DialogHeader className="sr-only"><DialogTitle>Command palette</DialogTitle><DialogDescription>Search platform actions and security records.</DialogDescription></DialogHeader><div className="border-b p-3"><Input autoFocus placeholder="Search alerts, assets, and actions…" aria-label="Search commands" /></div><div className="p-2 text-sm"><p className="px-2 py-2 text-xs font-medium text-muted-foreground">Quick actions</p>{["Open incidents", "Search alerts", "Create investigation"].map((action) => <button key={action} className="interactive flex w-full items-center justify-between rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:bg-muted" onClick={() => setOpen(false)}>{action}<Check className="h-4 w-4 text-muted-foreground" aria-hidden="true" /></button>)}</div></DialogContent></Dialog>;
}
