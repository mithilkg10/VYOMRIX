"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Database, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ActivityTimeline, ChartContainer, DataTableShell, FilterBar, SearchInput, StatusBadge } from "@/components/system/data-display";
import { EmptyState, ErrorState, LoadingState } from "@/components/system/feedback";
import { ConfirmationDialog, Drawer } from "@/components/system/overlays";
import { MetricCard, PageHeader, SectionHeader } from "@/components/system/page";
import { FormField, FormGrid, Pagination } from "@/components/system/forms";

export default function DesignSystemPage() {
  const [page, setPage] = useState(2);
  const [owner, setOwner] = useState("");
  const [showOwnerError, setShowOwnerError] = useState(false);

  return (
    <div className="app-page space-y-8">
      <PageHeader title="Design system" description="Authenticated reference for MKG SOC Platform components, semantic states, density, and interaction patterns." />
      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard label="Default" value="1,245" detail="Neutral metric" icon={Database} />
        <MetricCard label="Success" value="98.4%" detail="Healthy coverage" icon={CheckCircle2} tone="success" />
        <MetricCard label="Warning" value="42" detail="Needs review" icon={AlertTriangle} tone="warning" />
        <MetricCard label="Critical" value="12" detail="Immediate action" icon={ShieldAlert} tone="danger" />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-5">
          <SectionHeader title="Controls" description="Buttons, fields, filters, and confirmation patterns." />
          <div className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              <Button>Primary</Button><Button variant="outline">Secondary</Button><Button variant="destructive">Destructive</Button><Button disabled>Disabled</Button>
              <Button variant="outline" onClick={() => toast.success("Investigation saved", { description: "The toast pattern is available for non-blocking updates." })}>Show toast</Button>
              <ConfirmationDialog trigger={<Button variant="outline">Confirm action</Button>} title="Confirm investigation action" description="This demonstrates the standard confirmation pattern." onConfirm={() => toast.success("Investigation action confirmed")} />
            </div>
            <FilterBar><SearchInput placeholder="Search assets..." /><div className="flex gap-2"><Input aria-label="Environment filter" placeholder="Environment" /><Button variant="outline">Filter</Button></div></FilterBar>
            <Textarea aria-label="Analyst note" placeholder="Add an analyst note..." />
          </div>
        </div>
        <div className="panel p-5">
          <SectionHeader title="Status and overlays" description="Semantic state colours and drawer behavior." />
          <div className="mt-5 flex flex-wrap gap-2"><StatusBadge status="neutral">Neutral</StatusBadge><StatusBadge status="success">Healthy</StatusBadge><StatusBadge status="warning">Warning</StatusBadge><StatusBadge status="danger">Critical</StatusBadge><StatusBadge status="info">Informational</StatusBadge></div>
          <div className="mt-5"><Drawer trigger={<Button variant="outline">Open drawer</Button>} title="Investigation context"><p className="p-1 text-sm text-muted-foreground">The standardized drawer supports contextual workflows without taking analysts away from a table or timeline.</p></Drawer></div>
        </div>
      </section>
      <section className="panel p-5">
        <SectionHeader title="Form and pagination patterns" description="Labels, descriptions, errors, and keyboard-operable paging." />
        <FormGrid className="mt-5">
          <FormField id="rule-name" label="Rule name" description="Use a concise, analyst-readable name."><Input id="rule-name" placeholder="Suspicious process execution" /></FormField>
          <FormField id="owner" label="Owner" error={showOwnerError && !owner ? "An owner is required before publishing." : undefined}><Input id="owner" value={owner} onChange={(event) => setOwner(event.target.value)} aria-invalid={showOwnerError && !owner} placeholder="Select owner" /></FormField>
        </FormGrid>
        <div className="mt-4"><Button variant="outline" onClick={() => { setShowOwnerError(true); if (owner) toast.success("Form validation passed"); }}>Validate form</Button></div>
        <div className="mt-5 border-t pt-4"><Pagination page={page} totalPages={8} onPageChange={setPage} /></div>
      </section>
      <section className="grid gap-6 lg:grid-cols-3">
        <LoadingState label="Loading asset coverage..." />
        <EmptyState title="No saved views" description="Create a filtered view to reuse it across investigations." />
        <ErrorState title="Threat feed unavailable" description="The provider did not respond. Your saved search is unchanged." onRetry={() => toast.info("Retry requested")} />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <ChartContainer title="Chart container"><div className="flex h-40 items-center justify-center rounded-lg border border-dashed bg-muted/30 text-sm text-muted-foreground">Normalized chart canvas</div></ChartContainer>
        <div className="panel p-5"><SectionHeader title="Activity timeline" /><div className="mt-5"><ActivityTimeline items={[{ title: "Alert correlated", description: "WAF and endpoint signals linked", time: "2m ago", tone: "danger" }, { title: "Analyst assigned", description: "Investigation owner updated", time: "8m ago", tone: "success" }]} /></div></div>
      </section>
      <section><SectionHeader title="Data table shell" description="Horizontal containment, semantic table structure, and dense information display." /><div className="mt-4"><DataTableShell caption="Example security events"><thead className="border-b bg-muted/50 text-left text-xs text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Source</th><th className="px-4 py-3 font-medium">Status</th></tr></thead><tbody><tr className="border-b"><td className="px-4 py-3 font-medium">Suspicious PowerShell</td><td className="px-4 py-3">Endpoint</td><td className="px-4 py-3"><StatusBadge status="danger">Critical</StatusBadge></td></tr></tbody></DataTableShell></div></section>
      <Card className="panel"><CardHeader><CardTitle>Usage guidance</CardTitle><CardDescription>Use semantic tokens and system components before creating page-specific patterns.</CardDescription></CardHeader><CardContent className="text-sm text-muted-foreground">All examples support the primary dark theme, full light theme, keyboard focus, reduced motion, and screen-reader status semantics.</CardContent></Card>
    </div>
  );
}
