import { UnderDevelopment } from "@/components/ui/under-development";

export default function PhishingAnalyzerPage() {
  return <UnderDevelopment title="Phishing Analyzer" description="Analyze suspicious messages and attachments with AI-assisted extraction, reputation checks, and triage evidence." plannedCapabilities={["Email and attachment intake", "IOC extraction and reputation enrichment", "Analyst verdicts and incident escalation"]} />;
}
