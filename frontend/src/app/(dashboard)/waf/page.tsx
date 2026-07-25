import { IntegrationUnavailableState } from "@/components/system/feedback";
import { PageContainer, PageHeader } from "@/components/system/page";
export default function WafPage() { return <PageContainer><PageHeader title="Web Application Firewall" description="WAF event ingestion is supported, but no analyst-facing read endpoint is configured." /><IntegrationUnavailableState integrationName="WAF event feed" reason="No read-only event or rule endpoint is available." guidance="No blocked-request totals or attack records are shown." /></PageContainer>; }
