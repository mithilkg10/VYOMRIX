"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendApiUrl } from "@/lib/api/config";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  getAccessTokenCookieOptions,
  getRefreshTokenCookieOptions,
  clearAuthCookiesAction
} from "@/lib/api/cookies";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  let res;
  let data;
  try {
    res = await fetch(getBackendApiUrl() + "/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      // OAuth2PasswordRequestForm requires form data
      body: new URLSearchParams({
        username: email,
        password: password,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      return { error: errorData?.detail || "Invalid credentials" };
    }

    data = await res.json();
  } catch (e) {
    console.error("Backend fetch error:", e);
    return { error: "Service unavailable. Could not connect to backend." };
  }
    
  // Set cookie
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, getAccessTokenCookieOptions());

  if (data.refresh_token) {
    cookieStore.set(REFRESH_TOKEN_COOKIE, data.refresh_token, getRefreshTokenCookieOptions());
  }

  redirect("/");
}

export async function logoutAction() {
    await clearAuthCookiesAction();
    redirect("/login");
}

