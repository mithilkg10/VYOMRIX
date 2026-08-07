"use server";

import { getBackendApiUrl } from "@/lib/api/config";

export async function resetPasswordAction(formData: FormData) {
  const token = formData.get("token") as string;
  const new_password = formData.get("new_password") as string;
  const confirm_password = formData.get("confirm_password") as string;
  
  if (!token) return { error: "Reset token is missing" };
  if (!new_password) return { error: "New password is required" };
  if (new_password !== confirm_password) return { error: "Passwords do not match" };
  
  // Basic strength check (can use Zod in real app)
  if (new_password.length < 12) {
    return { error: "Password must be at least 12 characters long" };
  }
  
  try {
    const res = await fetch(getBackendApiUrl() + "/api/v1/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, new_password }),
      cache: "no-store"
    });

    if (!res.ok) {
      const details = await res.json().catch(() => null);
      return { error: details?.detail || "Failed to reset password." };
    }
    
    const data = await res.json();
    return { success: data.message };
  } catch (err: any) {
    return { error: "Failed to connect to authentication server." };
  }
}
