# VoiceNexus handoff

Lifecycle state: `CODE_READY`. A connection becomes `VERIFIED` only after VoiceNexus successfully authenticates and imports a real signed event.

An owner can send an owner-visible lead from Settings. LeadNexus persists a strict version `1.0` `LEAD_HANDOFF_REQUESTED` event before delivery, signs the exact request body with timestamped HMAC SHA-256, and posts it server-to-server to `VOICENEXUS_IMPORT_URL`. A successful strict acknowledgement marks the event `SENT`; network errors, rejected requests, invalid acknowledgements, and VoiceNexus errors mark it `FAILED` with a safe retry time. Retry uses the same event ID and body, so an acknowledgement loss cannot create another VoiceNexus lead.

The payload carries business and lead UUIDs, E.164 phone, optional email and product, contact intent, DNC, and LeadNexus pre-call intelligence. Unknown fields are rejected. Secrets never enter browser code. Required server environment variables are `VOICENEXUS_IMPORT_URL` and `VOICENEXUS_SHARED_SECRET` (at least 32 characters). Production requires an HTTPS import URL.

The signed pull/ack recovery endpoint is `/api/v1/integrations/leads`; it uses the same timestamp, request ID, canonical body digest, signature, and five-minute expiry window. Tenant-scoped acknowledgements require both the exact event ID and business ID. A completed `SENT` event cannot be downgraded by a later failure acknowledgement.

VoiceNexus result sync is not implemented in this phase. Its future contract is documented on the VoiceNexus side and excludes full transcripts by default.
