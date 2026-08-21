import { createClient } from "@supabase/supabase-js";

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
const publishableKey = requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
const secretKey = requireEnv("SUPABASE_SECRET_KEY");

function publicClient() {
  return createClient(supabaseUrl, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

const service = createClient(supabaseUrl, secretKey, {
  auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});

async function userClient(userId) {
  const { data, error } = await service.auth.admin.getUserById(userId);
  const email = data.user?.email;
  if (error || !email) throw new Error("Unable to resolve a business owner for RLS verification.");

  const { data: link, error: linkError } = await service.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  const tokenHash = link.properties?.hashed_token;
  if (linkError || !tokenHash) throw new Error("Unable to create a non-delivery verification session.");

  const client = publicClient();
  const { error: verifyError } = await client.auth.verifyOtp({
    type: "email",
    token_hash: tokenHash,
  });
  if (verifyError) throw new Error(`Unable to verify owner RLS: ${verifyError.message}`);
  return client;
}

const { data: adminProfile, error: adminProfileError } = await service
  .from("profiles")
  .select("id")
  .eq("platform_role", "PLATFORM_ADMIN")
  .limit(1)
  .single();
if (adminProfileError || !adminProfile) throw new Error("Platform administrator is unavailable.");

const admin = await userClient(adminProfile.id);

const { data: business, error: businessError } = await service
  .from("businesses")
  .select("id,name")
  .eq("name", "Aadhira SunGrid Energy")
  .single();
if (businessError || !business) throw new Error("Aadhira business is unavailable.");

const { data: reviews, error: reviewError } = await admin
  .from("lead_recovery_reviews")
  .select("lead_id")
  .eq("decision", "PENDING");
if (reviewError) throw new Error(`Unable to load pending reviews: ${reviewError.message}`);

const pendingIds = (reviews ?? []).map((review) => review.lead_id);
if (pendingIds.length === 0) throw new Error("No pending recovery candidate is available.");

const { data: candidate, error: candidateError } = await admin
  .from("leads")
  .select("id,business_id,visibility,contact_intent")
  .eq("business_id", business.id)
  .eq("visibility", "ADMIN_ONLY")
  .in("id", pendingIds)
  .limit(1)
  .maybeSingle();
if (candidateError || !candidate) throw new Error("No pending Aadhira admin-only candidate is available.");

const { error: sendError } = await admin.rpc("send_recovered_lead_to_owner", {
  target_lead_id: candidate.id,
  admin_note_value: "Lifecycle verified: reviewed by platform administration and released to the business owner.",
});
if (sendError) throw new Error(`Recovery handoff failed: ${sendError.message}`);

const [{ data: transitioned, error: transitionError }, { data: transitionedReview, error: transitionedReviewError }] = await Promise.all([
  service.from("leads").select("visibility,contact_intent,owner_visible_at").eq("id", candidate.id).single(),
  service.from("lead_recovery_reviews").select("decision,reviewed_by,reviewed_at,sent_at").eq("lead_id", candidate.id).single(),
]);
if (transitionError || transitionedReviewError || !transitioned || !transitionedReview) {
  throw new Error("Unable to verify the persisted recovery transition.");
}

const { data: ownerMembership, error: ownerMembershipError } = await service
  .from("business_members")
  .select("user_id")
  .eq("business_id", candidate.business_id)
  .eq("role", "OWNER")
  .limit(1)
  .single();
if (ownerMembershipError || !ownerMembership) throw new Error("Candidate business owner is unavailable.");

const { data: unrelatedMembership, error: unrelatedMembershipError } = await service
  .from("business_members")
  .select("user_id,business_id")
  .neq("business_id", candidate.business_id)
  .eq("role", "OWNER")
  .limit(1)
  .single();
if (unrelatedMembershipError || !unrelatedMembership) throw new Error("Unrelated business owner is unavailable.");

const [owner, unrelatedOwner] = await Promise.all([
  userClient(ownerMembership.user_id),
  userClient(unrelatedMembership.user_id),
]);

const [{ data: ownerVisible, error: ownerVisibleError }, { data: crossTenantVisible, error: crossTenantError }] = await Promise.all([
  owner.from("leads").select("id").eq("id", candidate.id).maybeSingle(),
  unrelatedOwner.from("leads").select("id").eq("id", candidate.id).maybeSingle(),
]);
if (ownerVisibleError || crossTenantError) throw new Error("Owner RLS verification query failed.");

const evidence = {
  before: { visibility: candidate.visibility, contactIntent: candidate.contact_intent, reviewDecision: "PENDING" },
  after: {
    visibility: transitioned.visibility,
    contactIntent: transitioned.contact_intent,
    ownerVisibleAtSet: Boolean(transitioned.owner_visible_at),
    reviewDecision: transitionedReview.decision,
    reviewedByAdmin: Boolean(transitionedReview.reviewed_by),
    reviewedAtSet: Boolean(transitionedReview.reviewed_at),
    sentAtSet: Boolean(transitionedReview.sent_at),
  },
  rls: {
    owningBusinessCanRead: Boolean(ownerVisible),
    unrelatedBusinessCanRead: Boolean(crossTenantVisible),
  },
};

if (
  evidence.after.visibility !== "OWNER_VISIBLE"
  || evidence.after.contactIntent !== "RECOVERED"
  || evidence.after.reviewDecision !== "SENT_TO_OWNER"
  || !evidence.rls.owningBusinessCanRead
  || evidence.rls.unrelatedBusinessCanRead
) {
  throw new Error(`Recovery lifecycle verification failed: ${JSON.stringify(evidence)}`);
}

await Promise.all([
  admin.auth.signOut({ scope: "local" }),
  owner.auth.signOut({ scope: "local" }),
  unrelatedOwner.auth.signOut({ scope: "local" }),
]);
console.log(JSON.stringify(evidence, null, 2));
