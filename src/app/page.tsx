import type {
  Metadata,
} from "next";

import {
  LandingPage,
} from "@/components/marketing/landing-page";

import {
  MarketingFooter,
} from "@/components/marketing/marketing-footer";

import {
  MarketingHeader,
} from "@/components/marketing/marketing-header";

export const metadata: Metadata = {
  title:
    "LeadNexus | Lead Intelligence & Recovery",

  description:
    "Capture business leads, understand visitor intent, recover high-value opportunities and manage conversions with LeadNexus.",
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      <main>
        <LandingPage />
      </main>

      <MarketingFooter />
    </div>
  );
}