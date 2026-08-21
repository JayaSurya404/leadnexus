# LeadNexus Project Status

Last updated: 2026-08-21

Overall lifecycle: `LOCAL_READY`

Current revision deployed: **false**

PSTN_REAL_CALL_VERIFIED: **false**

No deployment or PSTN call was performed during this checkpoint.

## 2026-08-21 capture and recovery completion

- Lifecycle: `LOCAL_READY`. This revision remains undeployed.
- Live data was extended additively without deleting the original 75 leads. Final admin-only recovery queues are Aadhira 8 (2 HOT, 3 PENDING), Aranya 6 (2 HOT, 3 PENDING), and Velora 6 (2 HOT, 3 PENDING).
- One real pending recovery was sent through the authenticated platform-admin RPC. The row changed from `ADMIN_ONLY`/`NONE`/`PENDING` to `OWNER_VISIBLE`/`RECOVERED`/`SENT_TO_OWNER`; the owning business could read it and an unrelated owner could not.
- Public capture now accepts an optional product, validates required name/E.164 phone fields visibly, reuses the session lead, and promotes that same lead only after a deliberate contact action. WhatsApp/email use the shared product-specific, business-generic, then safe-fallback template resolver.
- Live `logo_url`, `cover_url`, and product `image_url` values now render when no versioned Storage object exists. All three current business pages passed media/content browser checks.
- Velora's existing PostgreSQL UUID uses a non-RFC variant nibble. Public validation now accepts the exact PostgreSQL UUID shape without relaxing length or hexadecimal constraints; its session regression passes.
- Owner notes passed an authenticated browser check for saving state, success feedback, textarea reset, and immediate newest-first rendering.

### Executed quality evidence

- `npm run typecheck`: PASS.
- `npm run lint`: PASS with zero warnings.
- `npm test`: PASS, 8 files and 34 tests.
- `npm run build`: PASS, 32 generated pages/routes.
- Relevant Playwright coverage: PASS for 17 public, desktop/mobile, activity, auth-boundary, admin, recovery, notes, and capture/contact cases after stale fixture assertions were aligned to the current live businesses. No JWT timing error recurred when the application was run alone on port 3000.

## VoiceNexus integration

| Boundary | Lifecycle | Executed evidence / next gate |
| --- | --- | --- |
| Strict v1 handoff contract and HMAC signing | `LOCAL_READY` | A real owner Settings action produced signed event `61156d9d-4637-47c5-914e-ef690cc67e12`; VoiceNexus accepted it through the explicit mapping and returned a strict acknowledgement. Wrong signatures, expired timestamps, changed-body replay, and an unmapped business were rejected safely. |
| Durable outbox send/retry | `LOCAL_READY` | The primary event reached `SENT` on attempt 1 with timestamps, cleared error state, and persisted response evidence. A deterministic local endpoint outage put event `d9a5cc2e-b2bc-4773-a082-c761aa024075` into retryable `FAILED`; retry reused that event and reached `SENT` on attempt 2. |
| DNC handoff | `LOCAL_READY` | DNC event `d55ff602-347e-48b1-a6b1-87f2fa128539` reached `SENT`, VoiceNexus imported it as `DO_NOT_CALL`, and its PSTN session RPC was rejected before provider dispatch. |
| Signed recovery GET/ack endpoint | `LOCAL_READY` | Hosted owner delivery and retry both received authenticated strict acknowledgements. An exact duplicate returned the stored acknowledgement without another VoiceNexus lead. |
| Hosted LeadNexus schema | `LOCAL_READY` | Linked dry-run contained only `20260817120001_voicenexus_secure_delivery.sql`; it was applied successfully and appears in remote migration history. Hosted catalog verification passed for DNC/outbox columns, enum values, response constraint, active-event uniqueness, retry index, and existing-row validity. |
| Cross-product owner-action acceptance | `LOCAL_READY` | Business `aea4e168-7206-4d12-8f14-f79d6669619f` maps explicitly to organization `88c2132b-a894-452b-9a9a-2723025d0979`. Primary and later-update events both resolve to VoiceNexus lead `c40b7baf-97d2-4a0a-9865-f76e9040ba45`; both connection records are `VERIFIED`. |

## Quality evidence

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run test:unit`: PASS, 8 files and 32 tests.
- `npm run build`: PASS, 31 Next.js routes.
- `npm run test:e2e`: PASS, 17/17 Chromium desktop/mobile tests using the existing ignored demo-owner credentials.
- `npm run verify:voicenexus:acceptance`: PASS for owner authorization, signed delivery, exact-one import, `SENT`, later update, DNC, negative authentication/mapping cases, retry recovery, VoiceNexus lead detail, and secure Browser Test session creation.
- No production deployment or environment-variable change was made.

## Next gate

Deploy this exact revision to the existing LeadNexus target, configure the already-required server-only integration URL/secret privately, and run the deployed acceptance before any production-verification claim. No PSTN acceptance is part of this checkpoint.
