import { createHash, createHmac, randomBytes, randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { once } from "node:events";
import { readFileSync } from "node:fs";
import process from "node:process";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

const leadRoot = fileURLToPath(new URL("../", import.meta.url));
const voiceRoot = "D:/voicenexus";
const leadEnv = parseEnv(readFileSync(`${leadRoot}/.env.local`, "utf8"));
const voiceGatewayEnv = parseEnv(readFileSync(`${voiceRoot}/services/voice-gateway/.env`, "utf8"));
const leadBase = "http://localhost:3010";
const voiceBase = "http://127.0.0.1:3011";
const voiceEndpoint = `${voiceBase}/api/v1/integrations/leadnexus`;
const businessId = "aea4e168-7206-4d12-8f14-f79d6669619f";
const organizationId = "88c2132b-a894-452b-9a9a-2723025d0979";
const primaryLeadId = "e4ab9bf1-e9bc-4338-8e7c-b8d970203459";
const dncLeadId = "2fd9cd11-d1ab-42e1-8849-8a7ac43ee3c8";
const sharedSecret = leadEnv.VOICENEXUS_SHARED_SECRET;
const options = { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } };
const evidence = [];
const children = [];
let temporaryVoiceUserId = "";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function pass(check, details = {}) {
  evidence.push({ check, status: "PASS", ...details });
}

function findVoicePublishableKey() {
  const output = execFileSync("rg", ["-o", "--no-filename", "sb_publishable_[A-Za-z0-9_-]+", ".next"], { cwd: voiceRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
  const key = output.split(/\r?\n/).find(Boolean);
  if (!key) throw new Error("The production-built VoiceNexus publishable key artifact is unavailable.");
  return key;
}

function signingInput(timestamp, requestId, body) {
  const digest = createHash("sha256").update(body, "utf8").digest("hex");
  return ["voicenexus-integration-v1", timestamp, "POST", "/api/v1/integrations/leadnexus", requestId, digest].join("\n");
}

function signature(secret, timestamp, requestId, body) {
  return `v1=${createHmac("sha256", secret).update(signingInput(timestamp, requestId, body), "utf8").digest("hex")}`;
}

function strictPayload(payload) {
  return {
    schemaVersion: payload.schemaVersion,
    event: payload.event,
    eventId: payload.eventId,
    requestedAt: payload.requestedAt,
    business: { id: payload.business.id, name: payload.business.name, slug: payload.business.slug },
    lead: {
      id: payload.lead.id,
      name: payload.lead.name,
      phone: payload.lead.phone,
      email: payload.lead.email,
      status: payload.lead.status,
      contactIntent: payload.lead.contactIntent,
      doNotCall: payload.lead.doNotCall,
      createdAt: payload.lead.createdAt,
    },
    product: payload.product ? { id: payload.product.id, name: payload.product.name } : null,
    intelligence: payload.intelligence ? {
      temperature: payload.intelligence.temperature,
      score: payload.intelligence.score,
      primaryInterest: payload.intelligence.primaryInterest,
      buyingIntent: payload.intelligence.buyingIntent,
      reasons: payload.intelligence.reasons,
      recommendedAction: payload.intelligence.recommendedAction,
    } : null,
  };
}

async function signedPost(payload, { secret = sharedSecret, timestamp = String(Math.floor(Date.now() / 1000)), bodyOverride } = {}) {
  const body = bodyOverride ?? JSON.stringify(payload);
  return fetch(voiceEndpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-integration-timestamp": timestamp,
      "x-integration-request-id": payload.eventId,
      "x-integration-signature": signature(secret, timestamp, payload.eventId, body),
    },
    body,
  });
}

function startNode(args, cwd, env) {
  const child = spawn(process.execPath, args, { cwd, env, stdio: "inherit" });
  children.push(child);
  return child;
}

async function stopNode(child) {
  if (!child || child.exitCode !== null) return;
  child.kill("SIGTERM");
  await Promise.race([
    once(child, "exit"),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Local verifier did not stop.")), 10_000)),
  ]);
}

async function waitFor(url, label) {
  for (let attempt = 0; attempt < 120; attempt += 1) {
    try {
      if ((await fetch(url)).ok) return;
    } catch { /* service is starting */ }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(`${label} did not become ready.`);
}

async function poll(getValue, predicate, label, timeoutMs = 45_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await getValue();
    if (predicate(value)) return value;
    await new Promise((resolve) => setTimeout(resolve, 750));
  }
  throw new Error(`${label} did not reach the expected state.`);
}

async function loginLeadOwner(page, base = leadBase) {
  await page.goto(`${base}/login`);
  await page.locator('input[name="email"]').fill(leadEnv.DEMO_OWNER_EMAIL);
  await page.locator('input[name="password"]').fill(leadEnv.DEMO_OWNER_PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL(/\/dashboard$/);
}

async function sendLeadFromSettings(page, leadName, buttonName) {
  await page.goto(`${new URL(page.url()).origin}/settings`);
  const row = page.locator("div.rounded-xl.border.p-4").filter({ hasText: leadName }).first();
  await row.waitFor();
  const button = row.getByRole("button", { name: buttonName, exact: true });
  if (await button.count() !== 1) throw new Error(`Expected ${buttonName} for ${leadName}; rendered row was: ${(await row.innerText()).replaceAll("\n", " | ")}`);
  await button.click();
}

async function latestEvent(admin, leadId, excludedId = "") {
  let query = admin.from("outbox_events").select("id,business_id,payload,status,attempt_count,last_error,available_at,last_attempt_at,sent_at,processed_at,response_payload").eq("business_id", businessId).eq("provider", "VOICENEXUS").eq("aggregate_id", leadId).order("created_at", { ascending: false }).limit(1);
  if (excludedId) query = query.neq("id", excludedId);
  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(`LeadNexus outbox query failed: ${error.message}`);
  return data;
}

const requiredLead = ["NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_SECRET_KEY", "DEMO_OWNER_EMAIL", "DEMO_OWNER_PASSWORD", "VOICENEXUS_SHARED_SECRET"];
assert(requiredLead.every((name) => leadEnv[name]), "LeadNexus acceptance environment is incomplete.");
assert(sharedSecret.length >= 32, "The shared integration secret must contain at least 32 characters.");
assert(voiceGatewayEnv.SUPABASE_URL && voiceGatewayEnv.SUPABASE_SECRET_KEY && voiceGatewayEnv.VOICE_GATEWAY_SHARED_SECRET, "VoiceNexus gateway environment is incomplete.");
const voicePublishableKey = findVoicePublishableKey();
pass("server-only acceptance secret is present on both server processes and matches without entering browser configuration");

const leadAdmin = createClient(leadEnv.NEXT_PUBLIC_SUPABASE_URL, leadEnv.SUPABASE_SECRET_KEY, options);
const voiceAdmin = createClient(voiceGatewayEnv.SUPABASE_URL, voiceGatewayEnv.SUPABASE_SECRET_KEY, options);
const nextLead = fileURLToPath(new URL("../node_modules/next/dist/bin/next", import.meta.url));
const nextVoice = `${voiceRoot}/node_modules/next/dist/bin/next`;
const tsxVoice = `${voiceRoot}/node_modules/tsx/dist/cli.mjs`;

let browser;
try {
  const [{ data: leads, error: leadsError }, { data: mapping, error: mappingError }] = await Promise.all([
    leadAdmin.from("leads").select("id,name,phone,email,primary_product_id,do_not_call").in("id", [primaryLeadId, dncLeadId]).eq("business_id", businessId),
    voiceAdmin.from("leadnexus_connections").select("organization_id,external_business_id,status").eq("organization_id", organizationId).eq("external_business_id", businessId).single(),
  ]);
  if (leadsError || mappingError || leads?.length !== 2 || !mapping) throw new Error(leadsError?.message ?? mappingError?.message ?? "Acceptance fixtures are unavailable.");
  const primaryLead = leads.find((lead) => lead.id === primaryLeadId);
  const dncLead = leads.find((lead) => lead.id === dncLeadId);
  assert(primaryLead && dncLead && !primaryLead.do_not_call && dncLead.do_not_call, "Acceptance DNC fixtures are incorrect.");
  pass("existing owner business and explicit VoiceNexus organization mapping resolved", { businessId, organizationId });

  const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
  const voiceEmail = `voicenexus.acceptance.owner.${suffix}@gmail.com`;
  const voicePassword = `Vn!${randomBytes(18).toString("base64url")}9z`;
  const { data: createdVoiceUser, error: voiceUserError } = await voiceAdmin.auth.admin.createUser({ email: voiceEmail, password: voicePassword, email_confirm: true, user_metadata: { display_name: "LeadNexus Acceptance Owner" } });
  if (voiceUserError || !createdVoiceUser.user) throw new Error(voiceUserError?.message ?? "Temporary VoiceNexus owner could not be created.");
  temporaryVoiceUserId = createdVoiceUser.user.id;
  const { error: profileError } = await voiceAdmin.from("profiles").upsert({ id: temporaryVoiceUserId, display_name: "LeadNexus Acceptance Owner", platform_role: "USER" }, { onConflict: "id" });
  if (profileError) throw new Error(`Temporary VoiceNexus profile failed: ${profileError.message}`);
  const { error: membershipError } = await voiceAdmin.from("organization_members").insert({ organization_id: organizationId, user_id: temporaryVoiceUserId, role: "OWNER" });
  if (membershipError) throw new Error(`Temporary VoiceNexus membership failed: ${membershipError.message}`);

  const common = { ...process.env };
  const voiceWebEnv = {
    ...common,
    NEXT_PUBLIC_APP_URL: voiceBase,
    NEXT_PUBLIC_SUPABASE_URL: voiceGatewayEnv.SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: voicePublishableKey,
    SUPABASE_SECRET_KEY: voiceGatewayEnv.SUPABASE_SECRET_KEY,
    VOICE_GATEWAY_URL: "http://127.0.0.1:8081",
    VOICE_GATEWAY_SHARED_SECRET: voiceGatewayEnv.VOICE_GATEWAY_SHARED_SECRET,
    LEADNEXUS_SHARED_SECRET: sharedSecret,
    ENABLE_PROVIDER_SIMULATOR: "false",
  };
  const gatewayEnv = {
    ...common,
    ...voiceGatewayEnv,
    NODE_ENV: "development",
    PORT: "8081",
    PUBLIC_GATEWAY_URL: "",
    ALLOWED_WEB_ORIGINS: voiceBase,
  };
  const leadWebEnv = {
    ...common,
    ...leadEnv,
    NEXT_PUBLIC_APP_URL: leadBase,
    VOICENEXUS_IMPORT_URL: voiceEndpoint,
  };
  startNode([tsxVoice, "services/voice-gateway/src/index.ts"], voiceRoot, gatewayEnv);
  let voiceWeb = startNode([nextVoice, "start", "-p", "3011"], voiceRoot, voiceWebEnv);
  startNode([nextLead, "dev", "-p", "3010"], leadRoot, leadWebEnv);
  await Promise.all([
    waitFor(`${leadBase}/api/health`, "LeadNexus"),
    waitFor(`${voiceBase}/login`, "VoiceNexus"),
    waitFor("http://127.0.0.1:8081/health/live", "Voice gateway"),
  ]);

  browser = await chromium.launch({ headless: true });
  const leadPage = await browser.newPage();
  const leadConsoleErrors = [];
  leadPage.on("console", (message) => { if (message.type() === "error") leadConsoleErrors.push(message.text()); });
  await loginLeadOwner(leadPage);

  const beforePrimary = await latestEvent(leadAdmin, primaryLeadId);
  let firstEvent = beforePrimary;
  if (!firstEvent || firstEvent.status !== "SENT") {
    await sendLeadFromSettings(leadPage, primaryLead.name, "Send to VoiceNexus");
    firstEvent = await poll(
      () => latestEvent(leadAdmin, primaryLeadId),
      (event) => event?.id !== beforePrimary?.id && event?.status === "SENT",
      "primary owner handoff",
    );
  }
  assert(firstEvent.attempt_count === 1 && firstEvent.sent_at && firstEvent.processed_at && !firstEvent.last_error, "Primary SENT evidence is incomplete.");
  assert(firstEvent.response_payload?.status === "IMPORTED" && firstEvent.response_payload?.eventId === firstEvent.id, "Primary acknowledgement evidence is invalid.");
  const voiceLeadId = firstEvent.response_payload.voiceNexusLeadId;
  const { data: importedLead, error: importedError } = await voiceAdmin.from("leads").select("id,organization_id,external_source,external_id,name,phone,email,status,source,interest,product_or_service,temperature,lead_score,qualification_reasons,enrichment_payload").eq("id", voiceLeadId).single();
  if (importedError) throw new Error(`Imported VoiceNexus lead failed: ${importedError.message}`);
  assert(importedLead.organization_id === organizationId && importedLead.external_source === "LEADNEXUS" && importedLead.external_id === primaryLeadId, "Imported lead tenant identity is incorrect.");
  assert(importedLead.name === primaryLead.name && importedLead.phone === primaryLead.phone && importedLead.email === primaryLead.email, "Imported lead contact fields are incorrect.");
  assert(
    importedLead.enrichment_payload?.leadnexus?.preCallIntelligence?.score === firstEvent.payload.intelligence?.score
      && importedLead.enrichment_payload?.leadnexus?.preCallIntelligence?.temperature === firstEvent.payload.intelligence?.temperature,
    "Imported pre-call intelligence does not match the accepted signed event.",
  );
  assert(importedLead.temperature === "UNQUALIFIED" && importedLead.lead_score === null && importedLead.qualification_reasons?.length === 0, "Pre-call intelligence overwrote VoiceNexus post-call qualification.");
  pass("real owner UI action persisted, signed, imported, acknowledged, and reached SENT", { eventId: firstEvent.id, voiceNexusLeadId: voiceLeadId });

  const duplicateResponse = await signedPost(strictPayload(firstEvent.payload));
  const duplicateJson = await duplicateResponse.json();
  assert(duplicateResponse.status === 200 && duplicateJson.duplicate === true && duplicateJson.voiceNexusLeadId === voiceLeadId, "Exact duplicate delivery was not idempotent.");
  const { count: duplicateCount } = await voiceAdmin.from("leads").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("external_source", "LEADNEXUS").eq("external_id", primaryLeadId);
  assert(duplicateCount === 1, "Duplicate delivery created another VoiceNexus lead.");
  pass("exact duplicate delivery returned the stored acknowledgement and retained one lead");

  const updatedAction = `Owner reviewed updated context ${suffix}`;
  const { error: intelligenceUpdateError } = await leadAdmin.from("lead_intelligence").update({ score: 94, recommended_action: updatedAction, updated_at: new Date().toISOString() }).eq("lead_id", primaryLeadId).eq("business_id", businessId);
  if (intelligenceUpdateError) throw new Error(`LeadNexus intelligence update failed: ${intelligenceUpdateError.message}`);
  const beforeUpdate = await latestEvent(leadAdmin, primaryLeadId);
  const updatePage = await browser.newPage();
  await loginLeadOwner(updatePage);
  await sendLeadFromSettings(updatePage, primaryLead.name, "Send update");
  const updateEvent = await poll(
    () => latestEvent(leadAdmin, primaryLeadId),
    (event) => event?.id !== beforeUpdate?.id && event?.status === "SENT",
    "later owner update",
  );
  await updatePage.close();
  const { data: updatedImported } = await voiceAdmin.from("leads").select("id,enrichment_payload,temperature,lead_score,qualification_reasons").eq("id", voiceLeadId).single();
  assert(updateEvent.response_payload?.voiceNexusLeadId === voiceLeadId && updatedImported?.enrichment_payload?.leadnexus?.preCallIntelligence?.score === 94 && updatedImported.enrichment_payload.leadnexus.preCallIntelligence.recommendedAction === updatedAction, "Later event did not update the same VoiceNexus lead.");
  assert(updatedImported.temperature === "UNQUALIFIED" && updatedImported.lead_score === null && updatedImported.qualification_reasons?.length === 0, "Later pre-call update overwrote post-call qualification.");
  pass("legitimate later event updated pre-call context on the same VoiceNexus lead", { eventId: updateEvent.id, voiceNexusLeadId: voiceLeadId });

  let dncEvent = await latestEvent(leadAdmin, dncLeadId);
  if (!dncEvent || dncEvent.status !== "SENT") {
    const beforeDnc = dncEvent;
    const dncPage = await browser.newPage();
    await loginLeadOwner(dncPage);
    await sendLeadFromSettings(dncPage, dncLead.name, "Send to VoiceNexus");
    dncEvent = await poll(
      () => latestEvent(leadAdmin, dncLeadId),
      (event) => event?.id !== beforeDnc?.id && event?.status === "SENT",
      "DNC owner handoff",
    );
    await dncPage.close();
  }
  const dncVoiceLeadId = dncEvent.response_payload?.voiceNexusLeadId;
  const { data: dncImported } = await voiceAdmin.from("leads").select("status,enrichment_payload").eq("id", dncVoiceLeadId).single();
  assert(dncEvent.response_payload?.doNotCall === true && dncImported?.status === "DO_NOT_CALL", "DNC did not survive the handoff.");

  const voiceUserClient = createClient(voiceGatewayEnv.SUPABASE_URL, voicePublishableKey, options);
  const { error: voiceLoginError } = await voiceUserClient.auth.signInWithPassword({ email: voiceEmail, password: voicePassword });
  if (voiceLoginError) throw new Error(`Temporary VoiceNexus login failed: ${voiceLoginError.message}`);
  const [{ data: agent }, { data: prompt }] = await Promise.all([
    voiceUserClient.from("voice_agents").select("id").eq("organization_id", organizationId).eq("active", true).limit(1).single(),
    voiceUserClient.from("prompt_templates").select("id,name").eq("organization_id", organizationId).limit(1).single(),
  ]);
  const { error: dncCallError } = await voiceUserClient.rpc("create_call_session_v2", { target_lead_id: dncVoiceLeadId, target_voice_agent_id: agent.id, target_prompt_id: prompt.id, request_idempotency_key: randomUUID(), requested_source: "PSTN", requested_provider: "TWILIO" });
  assert(Boolean(dncCallError) && /do.not.call/i.test(dncCallError.message), "DNC PSTN session creation was not blocked.");
  pass("DNC imported for recordkeeping and PSTN session creation was rejected before dispatch", { eventId: dncEvent.id, voiceNexusLeadId: dncVoiceLeadId });

  const changedTimestamp = String(Math.floor(Date.now() / 1000));
  const changedPayload = { ...updateEvent.payload, requestedAt: new Date(Number(changedTimestamp) * 1000).toISOString(), lead: { ...updateEvent.payload.lead, name: "Changed replay body" } };
  const [wrongSignature, expired, changedReplay] = await Promise.all([
    signedPost(updateEvent.payload, { secret: "wrong-integration-secret-with-32-characters" }),
    signedPost(updateEvent.payload, { timestamp: String(Math.floor(Date.now() / 1000) - 301) }),
    signedPost(changedPayload, { timestamp: changedTimestamp }),
  ]);
  const unmappedPayload = { ...updateEvent.payload, eventId: randomUUID(), requestedAt: new Date().toISOString(), business: { ...updateEvent.payload.business, id: randomUUID() } };
  const unmapped = await signedPost(unmappedPayload);
  assert(wrongSignature.status === 401 && expired.status === 401 && changedReplay.status === 409 && unmapped.status === 404, "Negative authentication or mapping status codes were incorrect.");
  pass("wrong signature, expired request, changed-body replay, and unmapped business were rejected safely");

  const failureToken = Date.now();
  const { data: failureLead, error: failureLeadError } = await leadAdmin.from("leads").insert({ business_id: businessId, primary_product_id: primaryLead.primary_product_id, name: `VoiceNexus Acceptance Failure ${failureToken}`, phone: `+1557${String(failureToken).slice(-7)}`, email: `voicenexus.failure.${failureToken}@example.test`, status: "NEW", visibility: "OWNER_VISIBLE", contact_intent: "NONE", owner_visible_at: new Date().toISOString(), do_not_call: false }).select("id,name").single();
  if (failureLeadError) throw new Error(`Failure fixture failed: ${failureLeadError.message}`);
  await stopNode(voiceWeb);
  const failurePage = await browser.newPage();
  await loginLeadOwner(failurePage);
  await sendLeadFromSettings(failurePage, failureLead.name, "Send to VoiceNexus");
  const failedEvent = await poll(() => latestEvent(leadAdmin, failureLead.id), (event) => event?.status === "FAILED", "failed delivery");
  assert(failedEvent.attempt_count === 1 && failedEvent.last_attempt_at && failedEvent.last_error && new Date(failedEvent.available_at).getTime() > Date.now(), "Failed delivery is not safely retryable.");
  await failurePage.close();
  voiceWeb = startNode([nextVoice, "start", "-p", "3011"], voiceRoot, voiceWebEnv);
  await waitFor(`${voiceBase}/login`, "restarted VoiceNexus verifier");
  const retryPage = await browser.newPage();
  await loginLeadOwner(retryPage);
  await sendLeadFromSettings(retryPage, failureLead.name, "Retry");
  const recoveredEvent = await poll(() => latestEvent(leadAdmin, failureLead.id), (event) => event?.status === "SENT" && event.attempt_count === 2, "failed delivery retry");
  await retryPage.close();
  assert(recoveredEvent.id === failedEvent.id && !recoveredEvent.last_error && recoveredEvent.sent_at, "Retry did not reuse and complete the original event.");
  pass("deterministic endpoint failure became FAILED/retryable and the same event recovered to SENT", { eventId: recoveredEvent.id });

  const { data: leadConnection } = await leadAdmin.from("integration_connections").select("status,connected_at,last_error,last_synced_at").eq("business_id", businessId).eq("provider", "VOICENEXUS").single();
  const { data: voiceConnection } = await voiceAdmin.from("leadnexus_connections").select("status,last_verified_at,safe_error").eq("organization_id", organizationId).single();
  assert(leadConnection?.status === "VERIFIED" && leadConnection.connected_at && !leadConnection.last_error && voiceConnection?.status === "VERIFIED" && voiceConnection.last_verified_at && !voiceConnection.safe_error, "Connection states are not honestly verified.");
  pass("both connection records became VERIFIED only after authenticated successful exchanges");

  const voicePage = await browser.newPage();
  const voiceConsoleErrors = [];
  voicePage.on("console", (message) => { if (message.type() === "error") voiceConsoleErrors.push(message.text()); });
  await voicePage.goto(`${voiceBase}/login`);
  await voicePage.getByLabel("Email").fill(voiceEmail);
  await voicePage.getByLabel("Password").fill(voicePassword);
  await voicePage.getByRole("button", { name: "Sign in" }).click();
  await voicePage.waitForURL(/\/dashboard$/);
  await voicePage.goto(`${voiceBase}/leads/${voiceLeadId}`);
  await voicePage.getByRole("heading", { name: primaryLead.name }).waitFor();
  await voicePage.getByText("LeadNexus pre-call intelligence").waitFor();
  await voicePage.getByText("LEADNEXUS", { exact: true }).first().waitFor();
  await voicePage.getByText(updatedAction).first().waitFor();
  const { data: completedAnalysis } = await voiceAdmin.from("lead_analyses").select("id,analysis_status,generated_at,model").eq("organization_id", organizationId).eq("lead_id", voiceLeadId).eq("analysis_status", "COMPLETED").maybeSingle();
  assert(completedAnalysis?.generated_at && completedAnalysis.model, "The imported lead does not have completed analysis evidence.");
  await voicePage.goto(`${voiceBase}/agents`);
  const ashaCard = voicePage.locator('[data-slot="card"]').filter({ hasText: "Asha" }).first();
  await ashaCard.getByRole("link", { name: "Test AI Agent" }).click();
  await voicePage.getByLabel("Prompt").click();
  await voicePage.getByRole("option").first().click();
  await voicePage.getByLabel("Lead context (optional)").click();
  await voicePage.getByRole("option", { name: primaryLead.name, exact: true }).click();
  await voicePage.getByRole("button", { name: "Create secure test session" }).click();
  await voicePage.getByRole("button", { name: /Grant microphone/ }).waitFor({ timeout: 30_000 });
  const { data: testSession } = await voiceAdmin.from("call_sessions").select("id,lead_id,source,provider,status").eq("organization_id", organizationId).eq("lead_id", voiceLeadId).eq("source", "TEST_AGENT").order("created_at", { ascending: false }).limit(1).single();
  assert(testSession?.provider === "BROWSER_TEST" && testSession.status === "QUEUED", "Browser Test Agent session was not created correctly.");
  pass("imported lead detail, LeadNexus context, completed analysis, agent selection, and Browser Test Agent session creation passed", { analysisId: completedAnalysis.id, callSessionId: testSession.id });

  for (const [path, heading] of [["/dashboard", "Dashboard"], ["/leads", "Leads"], [`/leads/${primaryLeadId}`, primaryLead.name], ["/settings", "Settings"]]) {
    await leadPage.goto(`${leadBase}${path}`);
    await leadPage.getByRole("heading", { name: heading, exact: typeof heading === "string" }).first().waitFor();
  }
  const { data: business } = await leadAdmin.from("businesses").select("slug").eq("id", businessId).single();
  const publicResponse = await leadPage.request.get(`${leadBase}/b/${business.slug}`);
  assert(publicResponse.ok(), "LeadNexus public business page regression failed.");
  assert(leadConsoleErrors.length === 0 && voiceConsoleErrors.length === 0, `Browser console errors: ${[...leadConsoleErrors, ...voiceConsoleErrors].join(" | ")}`);
  pass("LeadNexus dashboard, leads, lead detail, settings, intelligence, and public business page browser regressions passed");

  console.log(JSON.stringify({ status: "CROSS_PRODUCT_ACCEPTANCE_VERIFIED", businessId, organizationId, primaryLeadId, voiceNexusLeadId: voiceLeadId, firstEventId: firstEvent.id, updateEventId: updateEvent.id, dncEventId: dncEvent.id, dncVoiceLeadId, browserTestSessionId: testSession.id, evidence }, null, 2));
} finally {
  if (browser) await browser.close().catch(() => undefined);
  for (const child of children.reverse()) child.kill("SIGTERM");
  if (temporaryVoiceUserId) {
    await voiceAdmin.from("organization_members").delete().eq("organization_id", organizationId).eq("user_id", temporaryVoiceUserId);
    await voiceAdmin.auth.admin.deleteUser(temporaryVoiceUserId);
  }
}
