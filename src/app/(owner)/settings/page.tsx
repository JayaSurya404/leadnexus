import type {
  Metadata,
} from "next";

import {
  Settings,
} from "lucide-react";

import {
  VoiceNexusIntegrationPanel,
} from "@/components/settings/voicenexus-integration-panel";

import {
  getVoiceNexusIntegrationStatus,
} from "@/features/integrations/voicenexus";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

export const metadata: Metadata = {
  title:
    "Settings | LeadNexus",
};

export default async function SettingsPage() {
  const context =
    await requireOwner();

  const voiceNexus =
    await getVoiceNexusIntegrationStatus(
      context.business.id,
    );

  return (
    <div className="space-y-8">
      <div>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Settings className="size-4" />
          Business settings
        </div>

        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Settings
        </h1>

        <p className="mt-2 max-w-2xl text-muted-foreground">
          Manage LeadNexus
          integrations for{" "}
          <span className="font-medium text-foreground">
            {
              context.business
                .name
            }
          </span>
          .
        </p>
      </div>

      <VoiceNexusIntegrationPanel
        data={
          voiceNexus
        }
      />
    </div>
  );
}