"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearAuthCookiesAction } from "@/lib/api/cookies";
import { revokeCurrentSession } from "@/lib/api/revoke-session";

export async function logoutAction() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;

  try {
    await revokeCurrentSession(accessToken, refreshToken, sessionId);
  } catch (error) {
    console.error("Backend logout request failed:", error);
  }

  await clearAuthCookiesAction();
  redirect("/login");
}
