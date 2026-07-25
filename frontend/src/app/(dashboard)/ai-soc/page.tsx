import Link from "next/link";
import { Bot, Database, ShieldAlert, Server } from "lucide-react";
import { IntegrationUnavailableState } from "@/components/system/feedback";
import { PageContainer, PageHeader } from "@/components/system/page";
import { Button } from "@/components/ui/button";

export default function AiSocPage() {
  return <PageContainer>
    <PageHeader title="AI SOC" description="AI-assisted analysis is available only when a production AI provider is implemented and configured." />
    <IntegrationUnavailableState integrationName="AI services" reason="No production AI provider is currently available." guidance="No AI analysis, recommendations, or confidence scores have been generated." />
    <section className="grid gap-4 md:grid-cols-3" aria-label="Available platform sources">
      <SourceCard icon={ShieldAlert} title="Incidents" description="Review real incident records and analyst-owned investigation details." href="/incidents" />
      <SourceCard icon={Server} title="Assets" description="Review the loaded asset inventory and reported security posture." href="/assets" />
      <SourceCard icon={Database} title="SIEM" description="Investigate real Wazuh alerts and agent status when the integration is available." href="/siem/alerts" />
    </section>
    <p className="text-sm text-muted-foreground">Analysts must verify source records before taking response actions. This page does not generate or simulate AI findings.</p>
  </PageContainer>;
}

function SourceCard({ description, href, icon: Icon, title }: { description: string; href: string; icon: typeof Bot; title: string }) {
  return <section className="panel p-5"><Icon className="h-5 w-5 text-primary" aria-hidden="true" /><h2 className="mt-3 font-semibold">{title}</h2><p className="mt-1 text-sm text-muted-foreground">{description}</p><Button className="mt-4" variant="outline" size="sm" render={<Link href={href}>Open {title}</Link>} /></section>;
}
