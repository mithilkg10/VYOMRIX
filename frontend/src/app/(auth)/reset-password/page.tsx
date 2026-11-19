export const dynamic = "force-dynamic";

import { isHostedShowcase } from "@/lib/hosting";
import { HostedRecoveryNotice } from "@/components/auth/hosted-recovery-notice";
import { ResetPasswordScreen } from "./form";

export default function ResetPasswordPage() {
  return isHostedShowcase() ? <HostedRecoveryNotice /> : <ResetPasswordScreen />;
}
