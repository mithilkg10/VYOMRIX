"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendApiUrl } from "@/lib/api/config";
import { clearAuthCookiesAction } from "@/lib/api/cookies";

export async function logoutAction() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;

  if (accessToken && sessionId) {
    try {
      await fetch(`${getBackendApiUrl()}/api/v1/auth/logout?session_id=${encodeURIComponent(sessionId)}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      });
    } catch (error) {
      console.error("Backend logout request failed:", error);
    }
  }

  await clearAuthCookiesAction();
  redirect("/login");
}
