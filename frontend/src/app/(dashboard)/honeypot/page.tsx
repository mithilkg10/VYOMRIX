import { DemoFeaturePage } from "@/components/demo/DemoFeaturePage";
import { demoFeatures } from "@/lib/demo-feature-config";

export default function Page() {
  return <DemoFeaturePage config={demoFeatures.honeypot} />;
}
