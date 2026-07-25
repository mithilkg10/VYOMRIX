import { IntegrationUnavailableState } from "@/components/system/feedback";
import { PageContainer, PageHeader } from "@/components/system/page";
export default function DeceptionPage() { return <PageContainer><PageHeader title="Deception" description="OpenCanary ingestion is supported, but no analyst-facing telemetry feed is configured." /><IntegrationUnavailableState integrationName="Deception telemetry" reason="No event-list endpoint is available." guidance="No honeypot sessions or attacker activity are displayed." /></PageContainer>; }
