import { createClient } from "@supabase/supabase-js";
import type { Page } from "@playwright/test";

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name} in .env.local.`);
  return value;
}

const supabaseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requiredEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const projectRef = new URL(supabaseUrl).hostname.split(".")[0];
const service = createClient(supabaseUrl, requiredEnv("SUPABASE_SECRET_KEY"), {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function authenticateUser(page: Page, userId: string, destination: string) {
  const { data: userResult, error: userError } = await service.auth.admin.getUserById(userId);
  const email = userResult.user?.email;
  if (userError || !email) throw new Error("Unable to resolve the E2E user.");

  const { data: link, error: linkError } = await service.auth.admin.generateLink({ type: "magiclink", email });
  const tokenHash = link.properties?.hashed_token;
  if (linkError || !tokenHash) throw new Error("Unable to create an E2E verification session.");

  const publicAuth = createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
  const { data: verified, error: verifyError } = await publicAuth.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });
  if (verifyError || !verified.session) throw new Error("Unable to authenticate the E2E user.");

  const encoded = `base64-${Buffer.from(JSON.stringify(verified.session)).toString("base64url")}`;
  const chunks = Array.from(
    { length: Math.ceil(encoded.length / 3_180) },
    (_, index) => encoded.slice(index * 3_180, (index + 1) * 3_180),
  );
  const baseName = `sb-${projectRef}-auth-token`;
  await page.context().addCookies(chunks.map((value, index) => ({
    name: chunks.length === 1 ? baseName : `${baseName}.${index}`,
    value,
    url: "http://localhost:3000",
    sameSite: "Lax",
  })));

  await page.goto(destination);
}

export async function loginAsOwner(page: Page) {
  const { data: business, error: businessError } = await service
    .from("businesses")
    .select("id")
    .eq("slug", "aadhira-sungrid-energy")
    .single();
  if (businessError || !business) throw new Error("Aadhira is unavailable for E2E authentication.");

  const { data: membership, error: membershipError } = await service
    .from("business_members")
    .select("user_id")
    .eq("business_id", business.id)
    .eq("role", "OWNER")
    .limit(1)
    .single();
  if (membershipError || !membership) throw new Error("Aadhira owner is unavailable for E2E authentication.");

  await authenticateUser(page, membership.user_id, "/dashboard");
}

export async function loginAsAdmin(page: Page) {
  const { data: profile, error } = await service
    .from("profiles")
    .select("id")
    .eq("platform_role", "PLATFORM_ADMIN")
    .limit(1)
    .single();
  if (error || !profile) throw new Error("Platform administrator is unavailable for E2E authentication.");

  await authenticateUser(page, profile.id, "/admin");
}
