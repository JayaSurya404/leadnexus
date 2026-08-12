import type {
  Metadata,
} from "next";

import {
  TooltipProvider,
} from "@/components/ui/tooltip";

import "./globals.css";

const appUrl =
  process.env
    .NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase:
    new URL(
      appUrl,
    ),

  applicationName:
    "LeadNexus",

  title: {
    default:
      "LeadNexus",

    template:
      "%s | LeadNexus",
  },

  description:
    "Lead capture, visitor intelligence, recovery and lead management for businesses.",

  keywords: [
    "lead management",
    "lead intelligence",
    "lead recovery",
    "business leads",
    "visitor analytics",
  ],

  openGraph: {
    type: "website",

    siteName:
      "LeadNexus",

    title:
      "LeadNexus",

    description:
      "Capture, understand, recover and manage business leads.",
  },

  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children:
    React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground antialiased">
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}