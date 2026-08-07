"use server";

import { getBackendApiUrl } from "@/lib/api/config";

export async function forgotPasswordAction(formData: FormData) {
  const email = formData.get("email") as string;
  if (!email) return { error: "Email is required" };
  
  try {
    const res = await fetch(getBackendApiUrl() + "/api/v1/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
      cache: "no-store"
    });

    if (!res.ok) {
      const details = await res.json().catch(() => null);
      return { error: details?.detail || "Failed to request password reset." };
    }
    
    const data = await res.json();
    return { success: data.message };
  } catch (err: any) {
    return { error: "Failed to connect to authentication server." };
  }
}
