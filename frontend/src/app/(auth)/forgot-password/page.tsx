export const dynamic = "force-dynamic";

import { isHostedShowcase } from "@/lib/hosting";
import { HostedRecoveryNotice } from "@/components/auth/hosted-recovery-notice";
import { ForgotPasswordForm } from "./form";

export default function ForgotPasswordPage() {
  return isHostedShowcase() ? <HostedRecoveryNotice /> : <ForgotPasswordForm />;
}
