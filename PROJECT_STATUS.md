# LeadNexus Project Status

Last updated: 2026-08-18

Overall lifecycle: `CODE_READY`

Current revision deployed: **false**

PSTN_REAL_CALL_VERIFIED: **false**

No deployment or PSTN call was performed during this checkpoint.

## VoiceNexus integration

| Boundary | Lifecycle | Executed evidence / next gate |
| --- | --- | --- |
| Strict v1 handoff contract and HMAC signing | `CODE_READY` | Unit tests pass for exact contract validation, wrong/missing/tampered signatures, expired/future timestamps, invalid identity fields, endpoint failure, VoiceNexus 500, and invalid acknowledgement. |
| Durable outbox send/retry | `CODE_READY` | The owner action persists before delivery, uses the event UUID as the signed request ID, marks only a strict import acknowledgement `SENT`, and retains safe `FAILED` events with bounded retry timing. An active-event unique index prevents duplicate send rows. |
| DNC handoff | `CODE_READY` | Owner-visible leads have an explicit DNC flag. The v1 payload carries both the flag and safe status; UI labels DNC while VoiceNexus preserves it and blocks PSTN session creation. |
| Signed recovery GET/ack endpoint | `CODE_READY` | Bearer authentication was replaced by the same five-minute canonical-body HMAC scheme. Acknowledgements require exact event and business IDs, and cannot downgrade an already-sent event. |
| Hosted LeadNexus schema | `CODE_READY` | Append-only migration `20260817120001_voicenexus_secure_delivery.sql` exists and has local contract coverage. Linked list/dry-run is blocked by Supabase `403 LegacyDbConfigLoginRoleStatusError`; a read-only hosted probe confirms the migration columns are not yet present. |
| Cross-product owner-action acceptance | `CODE_READY` | VoiceNexus’s real signed hosted import verifier passed tenant mapping, replay/idempotency, later updates, cross-tenant isolation, negative requests, DNC, and audit evidence. LeadNexus cannot reach the required real `SENT` result until its hosted migration is applied, so this boundary is not `VERIFIED`. |

## Quality evidence

- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm run test:unit`: PASS, 8 files and 32 tests.
- `npm run build`: PASS, 31 Next.js routes.
- Full Playwright and cross-product `SENT` acceptance: BLOCKED by the unapplied hosted migration and missing demo-owner E2E credentials in `.env.local`.
- No production deployment or environment-variable change was made.

## Next gate

Restore Supabase project migration privileges for linked project `irhevyxoixzlewaagagq`, run `supabase db push --dry-run`, apply only `20260817120001_voicenexus_secure_delivery.sql`, verify the new columns and enum states, then run the real owner Send/Retry flow through VoiceNexus and confirm one imported lead plus LeadNexus `SENT`. Only after that evidence may the integration become `LOCAL_READY`/`VERIFIED`.
