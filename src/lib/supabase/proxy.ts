import { createServerClient } from "@supabase/ssr";

import {
  NextResponse,
  type NextRequest,
} from "next/server";

const protectedPrefixes = [
  "/onboarding",
  "/dashboard",
  "/leads",
  "/recovered-leads",
  "/products",
  "/links",
  "/analytics",
  "/seo",
  "/business",
  "/settings",
  "/admin",
  "/reset-password",
] as const;

const authPrefixes = [
  "/login",
  "/signup",
  "/forgot-password",
] as const;

function matchesPrefix(
  pathname: string,
  prefixes: readonly string[],
) {
  return prefixes.some(
    (prefix) =>
      pathname === prefix ||
      pathname.startsWith(
        `${prefix}/`,
      ),
  );
}

function copyAuthState(
  source: NextResponse,
  destination: NextResponse,
) {
  source.cookies
    .getAll()
    .forEach((cookie) => {
      destination.cookies.set(cookie);
    });

  source.headers.forEach(
    (value, key) => {
      const normalized =
        key.toLowerCase();

      if (
        normalized === "location" ||
        normalized === "set-cookie"
      ) {
        return;
      }

      destination.headers.set(
        key,
        value,
      );
    },
  );

  return destination;
}

export async function updateSession(
  request: NextRequest,
) {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const supabasePublishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL",
    );
  }

  if (!supabasePublishableKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    );
  }

  let supabaseResponse =
    NextResponse.next({
      request,
    });

  const supabase = createServerClient(
    supabaseUrl,
    supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },

        setAll(
          cookiesToSet,
          headers,
        ) {
          cookiesToSet.forEach(
            ({ name, value }) => {
              request.cookies.set(
                name,
                value,
              );
            },
          );

          supabaseResponse =
            NextResponse.next({
              request,
            });

          cookiesToSet.forEach(
            ({
              name,
              value,
              options,
            }) => {
              supabaseResponse.cookies.set(
                name,
                value,
                options,
              );
            },
          );

          Object.entries(
            headers,
          ).forEach(
            ([name, value]) => {
              supabaseResponse.headers.set(
                name,
                value,
              );
            },
          );
        },
      },
    },
  );

  const {
    data: claimsData,
    error: claimsError,
  } = await supabase.auth.getClaims();

  const userId =
    !claimsError &&
    typeof claimsData?.claims?.sub ===
      "string"
      ? claimsData.claims.sub
      : null;

  const isAuthenticated =
    Boolean(userId);

  const pathname =
    request.nextUrl.pathname;

  if (
    !isAuthenticated &&
    matchesPrefix(
      pathname,
      protectedPrefixes,
    )
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname = "/login";

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    return copyAuthState(
      supabaseResponse,
      NextResponse.redirect(
        loginUrl,
      ),
    );
  }

  if (
    isAuthenticated &&
    matchesPrefix(
      pathname,
      authPrefixes,
    )
  ) {
    const destination =
      request.nextUrl.clone();

    destination.pathname =
      "/dashboard";

    destination.search = "";

    return copyAuthState(
      supabaseResponse,
      NextResponse.redirect(
        destination,
      ),
    );
  }

  return supabaseResponse;
}