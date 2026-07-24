"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getBackendApiUrl } from "@/lib/api/config";

const ACCESS_TOKEN_COOKIE = "access_token";
const REFRESH_TOKEN_COOKIE = "refresh_token";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    const res = await fetch(getBackendApiUrl() + "/api/v1/auth/login", {
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

    const data = await res.json();
    
    // Set cookie
    const cookieStore = await cookies();
    cookieStore.set(ACCESS_TOKEN_COOKIE, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    if (data.refresh_token) {
        cookieStore.set(REFRESH_TOKEN_COOKIE, data.refresh_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: "/",
        });
    }

  } catch {
    return { error: "Failed to connect to authentication server." };
  }

  redirect("/");
}

export async function logoutAction() {
    const cookieStore = await cookies();
    cookieStore.delete(ACCESS_TOKEN_COOKIE);
    cookieStore.delete(REFRESH_TOKEN_COOKIE);
    redirect("/login");
}
