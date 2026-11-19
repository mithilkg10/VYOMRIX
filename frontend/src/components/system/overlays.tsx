"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Command, Moon, Sun } from "lucide-react";
import { useRouter } from "next/navigation";
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

const PALETTE_EVENT = "vyomrix:open-command-palette";

/** Opens the command palette from anywhere, for example the top bar search box. */
export function openCommandPalette() {
  window.dispatchEvent(new Event(PALETTE_EVENT));
}

const PALETTE_PAGES = [
  { title: "Overview", subtitle: "Security posture", url: "/" },
  { title: "Incidents", subtitle: "Investigation queue", url: "/incidents" },
  { title: "SIEM alerts", subtitle: "Wazuh alert stream", url: "/siem/alerts" },
  { title: "SIEM agents", subtitle: "Endpoint coverage", url: "/siem/agents" },
  { title: "Detection rules", subtitle: "Sigma and Wazuh rules", url: "/detection" },
  { title: "MITRE ATT&CK", subtitle: "Technique coverage", url: "/mitre" },
  { title: "Threat intelligence", subtitle: "IOC lookup", url: "/threat-intel" },
  { title: "Assets", subtitle: "Inventory", url: "/assets" },
  { title: "Reports", subtitle: "Incident reports", url: "/reports" },
  { title: "Audit log", subtitle: "Platform activity", url: "/audit" },
  { title: "Notifications", subtitle: "Alerts for you", url: "/notifications" },
  { title: "Settings", subtitle: "Workspace preferences", url: "/settings" },
];

type PaletteResult = { id: string; title: string; subtitle?: string; url: string; type?: string };

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [records, setRecords] = useState<PaletteResult[]>([]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); } };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(PALETTE_EVENT, onOpen);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener(PALETTE_EVENT, onOpen); };
  }, []);

  useEffect(() => {
    if (!open) { setQuery(""); setRecords([]); return; }
    const q = query.trim();
    if (q.length < 2) { setRecords([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/v1/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : { results: [] }))
        .then((data: { results?: PaletteResult[] }) => setRecords(data.results ?? []))
        .catch(() => undefined);
    }, 180);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [open, query]);

  const q = query.trim().toLowerCase();
  const pages = PALETTE_PAGES.filter((page) => !q || page.title.toLowerCase().includes(q) || page.subtitle.toLowerCase().includes(q));
  const go = (url: string) => { setOpen(false); router.push(url); };

  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger render={<Button variant="outline" size="sm" className="hidden gap-2 text-muted-foreground sm:inline-flex" aria-label="Open command palette"><Command className="h-4 w-4" aria-hidden="true" /><span>Search</span><kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px]">⌘K</kbd></Button>} /><DialogContent className="max-w-lg p-0"><DialogHeader className="sr-only"><DialogTitle>Command palette</DialogTitle><DialogDescription>Search platform pages and security records.</DialogDescription></DialogHeader><div className="border-b p-3"><Input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { const first = records[0]?.url ?? pages[0]?.url; if (first) go(first); } }} placeholder="Search incidents, assets, rules or pages…" aria-label="Search commands" /></div><div className="max-h-80 overflow-y-auto p-2 text-sm">{records.length > 0 && <><p className="px-2 py-2 text-xs font-medium text-muted-foreground">Records</p>{records.map((item) => <button key={item.type + item.id} className="interactive flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:bg-muted" onClick={() => go(item.url)}><span className="min-w-0"><span className="block truncate">{item.title}</span>{item.subtitle && <span className="block text-xs capitalize text-muted-foreground">{item.type} · {item.subtitle}</span>}</span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /></button>)}</>}<p className="px-2 py-2 text-xs font-medium text-muted-foreground">Go to</p>{pages.map((page) => <button key={page.url} className="interactive flex w-full items-center justify-between gap-3 rounded-md px-2 py-2 text-left hover:bg-muted focus-visible:bg-muted" onClick={() => go(page.url)}><span><span className="block">{page.title}</span><span className="block text-xs text-muted-foreground">{page.subtitle}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" /></button>)}{pages.length === 0 && records.length === 0 && <p className="px-2 py-6 text-center text-muted-foreground">No matches for “{query}”</p>}</div></DialogContent></Dialog>;
}
