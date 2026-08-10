import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

function getSafeNextPath(
  value: string | null,
) {
  if (!value) {
    return "/dashboard";
  }

  if (!value.startsWith("/")) {
    return "/dashboard";
  }

  if (value.startsWith("//")) {
    return "/dashboard";
  }

  if (value.includes("\\")) {
    return "/dashboard";
  }

  return value;
}

export async function GET(
  request: Request,
) {
  const requestUrl = new URL(
    request.url,
  );

  const code =
    requestUrl.searchParams.get("code");

  const next = getSafeNextPath(
    requestUrl.searchParams.get("next"),
  );

  if (!code) {
    const loginUrl = new URL(
      "/login",
      requestUrl.origin,
    );

    loginUrl.searchParams.set(
      "error",
      "missing_auth_code",
    );

    return NextResponse.redirect(
      loginUrl,
    );
  }

  const supabase = await createClient();

  const { error } =
    await supabase.auth.exchangeCodeForSession(
      code,
    );

  if (error) {
    console.error(
      "LeadNexus auth callback error:",
      error.message,
    );

    const loginUrl = new URL(
      "/login",
      requestUrl.origin,
    );

    loginUrl.searchParams.set(
      "error",
      "auth_callback_failed",
    );

    return NextResponse.redirect(
      loginUrl,
    );
  }

  return NextResponse.redirect(
    new URL(
      next,
      requestUrl.origin,
    ),
  );
}