import type {
  Metadata,
} from "next";

import {
  ExternalLink,
  Search,
} from "lucide-react";

import {
  SeoSettingsForm,
} from "@/components/seo/seo-settings-form";

import {
  Button,
} from "@/components/ui/button";

import {
  getSeoSettings,
} from "@/features/seo/queries";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

export const metadata: Metadata = {
  title:
    "SEO | LeadNexus",
};

export default async function SeoPage() {
  const context =
    await requireOwner();

  const settings =
    await getSeoSettings(
      context.business.id,
    );

  const appUrl =
    (
      process.env
        .NEXT_PUBLIC_APP_URL ??
      "http://localhost:3000"
    ).replace(
      /\/$/,
      "",
    );

  const publicUrl =
    `${appUrl}/b/${context.business.slug}`;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
        <div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Search className="size-4" />
            Search optimization
          </div>

          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            SEO
          </h1>

          <p className="mt-2 max-w-2xl text-muted-foreground">
            Configure search metadata,
            social sharing information
            and indexing for your
            public LeadNexus page.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
        >
          <a
            href={
              publicUrl
            }
            target="_blank"
            rel="noreferrer"
          >
            View public page
            <ExternalLink className="size-4" />
          </a>
        </Button>
      </div>

      <SeoSettingsForm
        settings={
          settings
        }
        businessName={
          context.business.name
        }
        publicUrl={
          publicUrl
        }
      />
    </div>
  );
}