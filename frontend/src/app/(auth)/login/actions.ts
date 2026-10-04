"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { clearAuthCookiesAction } from "@/lib/api/cookies";
import { revokeCurrentSession } from "@/lib/api/revoke-session";
import { OWNER_COOKIE_NAME } from "@/lib/demo-session";

export async function logoutAction() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;
  const sessionId = cookieStore.get("session_id")?.value;
  const refreshToken = cookieStore.get("refresh_token")?.value;
  const ownerSession = cookieStore.get(OWNER_COOKIE_NAME)?.value;

  try {
    if (!ownerSession) {
      await revokeCurrentSession(accessToken, refreshToken, sessionId);
    }
  } catch (error) {
    console.error("Backend logout request failed:", error);
  }

  await clearAuthCookiesAction();
  cookieStore.delete("demo_session");
  cookieStore.delete(OWNER_COOKIE_NAME);
  redirect("/login");
}