import { IntegrationUnavailableState } from "@/components/system/feedback";
import { PageContainer, PageHeader } from "@/components/system/page";
export default function HoneypotPage() { return <PageContainer><PageHeader title="Honeypot" description="Honeypot telemetry is represented by the Deception ingestion capability." /><IntegrationUnavailableState integrationName="Honeypot telemetry" reason="No separate honeypot read or control endpoint is registered." guidance="Use Deception when a telemetry feed becomes available." /></PageContainer>; }
