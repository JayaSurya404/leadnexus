"use client";

import {
  Briefcase,
  Camera,
  Globe,
  Mail,
  MessageCircle,
  MessageSquare,
  Phone,
  Play,
  Send,
  Users,
} from "lucide-react";

import {
  Button,
} from "@/components/ui/button";

import type {
  PublicSocialLink,
} from "@/types/public-business";

type ContactSectionProps = {
  businessId: string;
  phone?: string | null;
  email?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  socials: PublicSocialLink[];
  sessionId?: string | null;
};

type ContactOption = {
  label: string;
  icon: React.ReactNode;
  url: string;
  event: string;
};

function platformIcon(
  platform: string,
) {
  switch (platform) {
    case "INSTAGRAM":
      return (
        <Camera className="size-5" />
      );
    case "FACEBOOK":
      return (
        <Users className="size-5" />
      );
    case "LINKEDIN":
      return (
        <Briefcase className="size-5" />
      );
    case "YOUTUBE":
      return (
        <Play className="size-5" />
      );
    case "X":
      return (
        <MessageSquare className="size-5" />
      );
    case "TELEGRAM":
      return (
        <Send className="size-5" />
      );
    default:
      return (
        <Globe className="size-5" />
      );
  }
}

function platformEvent(
  platform: string,
) {
  switch (platform) {
    case "INSTAGRAM":
      return "INSTAGRAM_CLICK";
    case "FACEBOOK":
      return "FACEBOOK_CLICK";
    case "LINKEDIN":
      return "LINKEDIN_CLICK";
    case "YOUTUBE":
      return "YOUTUBE_CLICK";
    case "X":
      return "CTA_CLICK";
    case "TELEGRAM":
      return "TELEGRAM_CLICK";
    default:
      return "CTA_CLICK";
  }
}

export function ContactSection({
  businessId,
  phone,
  email,
  whatsapp,
  website,
  socials,
  sessionId,
}: ContactSectionProps) {
  function resolveSessionId() {
    if (sessionId) {
      return sessionId;
    }

    if (typeof window === "undefined") {
      return null;
    }

    return window.sessionStorage.getItem(
      `leadnexus:session:${businessId}`,
    );
  }

  function trackAndOpen(
    eventType: string,
    url: string,
  ) {
    const sid =
      resolveSessionId();

    if (sid) {
      const payload =
        JSON.stringify({
          businessId,
          sessionId: sid,
          eventType,
        });

      if (navigator.sendBeacon) {
        const blob = new Blob(
          [payload],
          {
            type: "application/json",
          },
        );

        navigator.sendBeacon(
          "/api/public/activity",
          blob,
        );
      } else {
        fetch(
          "/api/public/activity",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: payload,
            keepalive: true,
          },
        ).catch(() => {
          /* fire-and-forget */
        });
      }
    }

    if (
      url.startsWith("tel:") ||
      url.startsWith("mailto:")
    ) {
      window.open(url, "_self");
    } else {
      window.open(
        url,
        "_blank",
        "noopener,noreferrer",
      );
    }
  }

  const options: ContactOption[] =
    [];

  if (phone) {
    options.push({
      label: "Call",
      icon: (
        <Phone className="size-5" />
      ),
      url: `tel:${phone}`,
      event: "PHONE_CLICK",
    });
  }

  if (email) {
    options.push({
      label: "Email",
      icon: (
        <Mail className="size-5" />
      ),
      url: `mailto:${email}`,
      event: "EMAIL_CLICK",
    });
  }

  if (whatsapp) {
    const num =
      whatsapp.replace(
        /[^0-9]/g,
        "",
      );

    options.push({
      label: "WhatsApp",
      icon: (
        <MessageCircle className="size-5" />
      ),
      url: `https://wa.me/${num}`,
      event: "WHATSAPP_CLICK",
    });
  }

  if (website) {
    options.push({
      label: "Website",
      icon: (
        <Globe className="size-5" />
      ),
      url: website,
      event: "WEBSITE_CLICK",
    });
  }

  for (const social of socials) {
    options.push({
      label:
        social.label ||
        social.platform,
      icon: platformIcon(
        social.platform,
      ),
      url: social.url,
      event: platformEvent(
        social.platform,
      ),
    });
  }

  if (options.length === 0) {
    return null;
  }

  return (
    <section className="mt-8 rounded-2xl border bg-background p-6 shadow-sm">
      <h2 className="mb-5 text-xl font-semibold">
        Contact Business
      </h2>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {options.map(
          (opt) => (
            <Button
              key={`${opt.event}-${opt.url}`}
              variant="outline"
              className="flex h-24 flex-col items-center justify-center gap-2 whitespace-normal text-center"
              aria-label={
                opt.label
              }
              onClick={() =>
                trackAndOpen(
                  opt.event,
                  opt.url,
                )
              }
            >
              {opt.icon}

              <span className="text-sm font-medium">
                {opt.label}
              </span>
            </Button>
          ),
        )}
      </div>
    </section>
  );
}
