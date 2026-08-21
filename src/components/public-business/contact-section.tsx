"use client";

import {
  useState,
} from "react";

import {
  Briefcase,
  Camera,
  Globe,
  Loader2,
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

import {
  createPublicContact,
  ensurePublicSession,
  trackPublicActivity,
} from "@/features/tracking/browser";

import type {
  PublicActivityEvent,
  PublicContactChannel,
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
  event:
    PublicActivityEvent;
  channel?:
    PublicContactChannel;
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
): PublicActivityEvent {
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
      return "X_CLICK";
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
  const [
    loading,
    setLoading,
  ] = useState<string | null>(
    null,
  );

  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );

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

  async function trackAndOpen(
    option: ContactOption,
  ) {
    setError(null);
    setLoading(option.label);

    try {
      let sid =
        resolveSessionId();

      if (!sid) {
        sid = await ensurePublicSession({
          businessId,
          source:
            new URLSearchParams(
              window.location.search,
            ).get("utm_source") ??
            "Direct",
          landingPath:
            `${window.location.pathname}${window.location.search}`,
        });
      }

      let destination =
        option.url;

      if (option.channel) {
        const result =
          await createPublicContact({
            businessId,
            sessionId: sid,
            leadId:
              window.sessionStorage.getItem(
                `leadnexus:lead:${businessId}`,
              ),
            productId:
              window.sessionStorage.getItem(
                `leadnexus:product:${businessId}`,
              ),
            channel:
              option.channel,
          });

        destination =
          result.url;
      } else {
        await trackPublicActivity({
          businessId,
          sessionId: sid,
          eventType:
            option.event,
        });
      }

      if (
        destination.startsWith("tel:") ||
        destination.startsWith("mailto:")
      ) {
        window.open(
          destination,
          "_self",
        );
      } else {
        window.open(
          destination,
          "_blank",
          "noopener,noreferrer",
        );
      }
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to open this contact option.",
      );
    } finally {
      setLoading(null);
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
      channel: "PHONE",
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
      channel: "EMAIL",
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
      channel: "WHATSAPP",
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
      channel: "WEBSITE",
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
      channel:
        social.platform ===
          "INSTAGRAM" ||
        social.platform ===
          "FACEBOOK" ||
        social.platform ===
          "LINKEDIN"
          ? social.platform
          : undefined,
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
              disabled={
                loading !== null
              }
              onClick={() =>
                void trackAndOpen(
                  opt,
                )
              }
            >
              {loading ===
              opt.label ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                opt.icon
              )}

              <span className="text-sm font-medium">
                {opt.label}
              </span>
            </Button>
          ),
        )}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-4 text-sm text-destructive"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
