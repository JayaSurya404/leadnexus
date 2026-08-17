import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/20260817120001_voicenexus_secure_delivery.sql", "utf8");

describe("VoiceNexus secure delivery migration", () => {
  it("adds explicit honest connection states and DNC", () => {
    expect(migration).toContain("add value if not exists 'CONFIGURED'");
    expect(migration).toContain("add value if not exists 'VERIFIED'");
    expect(migration).toContain("do_not_call boolean not null default false");
  });

  it("keeps active handoffs unique and failures retryable", () => {
    expect(migration).toContain("outbox_events_active_voicenexus_lead_idx");
    expect(migration).toContain("status in ('PENDING','PROCESSING')");
    expect(migration).toContain("status in ('PENDING','FAILED')");
    expect(migration).toContain("response_payload jsonb");
  });
});
