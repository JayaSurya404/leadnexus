"use client";

import type {
  ReactNode,
} from "react";

import {
  useEffect,
  useState,
} from "react";

import {
  BriefcaseBusiness,
  Clock3,
  ExternalLink,
  Globe2,
  Link2,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Share2,
  Star,
} from "lucide-react";

import {
  PublicLeadForm,
} from "@/components/public-business/public-lead-form";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Button,
} from "@/components/ui/button";

import {
  createPublicContact,
  ensurePublicSession,
  trackPublicActivity,
} from "@/features/tracking/browser";

import type {
  PublicBusinessPageData,
  PublicContactChannel,
} from "@/types/public-business";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

type PublicBusinessPageProps = {
  data: PublicBusinessPageData;
};

export function PublicBusinessPage({
  data,
}: PublicBusinessPageProps) {
  const [
    sessionId,
    setSessionId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    leadId,
    setLeadId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    selectedProductId,
    setSelectedProductId,
  ] =
    useState<string | null>(
      null,
    );

  const [
    contactLoading,
    setContactLoading,
  ] =
    useState<
      PublicContactChannel | null
    >(null);

  const [
    contactError,
    setContactError,
  ] =
    useState<string | null>(
      null,
    );

  useEffect(() => {
    let active =
      true;

    async function initialize() {
      let source:
        | string
        | null = null;

      const params =
        new URLSearchParams(
          window.location.search,
        );

      source =
        params.get(
          "utm_source",
        ) ??
        params.get(
          "source",
        );

      if (
        !source &&
        document.referrer
      ) {
        try {
          source =
            new URL(
              document.referrer,
            ).hostname;
        } catch {
          source =
            null;
        }
      }

      source =
        source ??
        "Direct";

      try {
        const id =
          await ensurePublicSession({
            businessId:
              data.business.id,

            source,

            landingPath:
              `${window.location.pathname}${window.location.search}`,
          });

        if (!active) {
          return;
        }

        setSessionId(id);

        const storedLeadId =
          window.sessionStorage.getItem(
            `leadnexus:lead:${data.business.id}`,
          );

        const storedProductId =
          window.sessionStorage.getItem(
            `leadnexus:product:${data.business.id}`,
          );

        if (storedLeadId) {
          setLeadId(storedLeadId);
        }

        if (storedProductId) {
          setSelectedProductId(
            storedProductId,
          );
        }

        void trackPublicActivity({
          businessId:
            data.business.id,

          sessionId:
            id,

          eventType:
            "PAGE_VIEW",

          pagePath:
            window.location.pathname,
        }).catch(
          () => undefined,
        );

        void trackPublicActivity({
          businessId:
            data.business.id,

          sessionId:
            id,

          eventType:
            "LEAD_FORM_VIEW",

          pagePath:
            window.location.pathname,
        }).catch(
          () => undefined,
        );
      } catch (error) {
        console.error(
          "LeadNexus visitor session:",
          error,
        );
      }
    }

    void initialize();

    return () => {
      active =
        false;
    };
  }, [
    data.business.id,
  ]);

  useEffect(() => {
    function onPageHide() {
      if (!sessionId) {
        return;
      }

      void trackPublicActivity({
        businessId:
          data.business.id,

        sessionId,

        leadId,

        productId:
          selectedProductId,

        eventType:
          "PAGE_EXIT",

        pagePath:
          window.location.pathname,

        keepalive:
          true,
      }).catch(
        () => undefined,
      );
    }

    window.addEventListener(
      "pagehide",
      onPageHide,
    );

    return () => {
      window.removeEventListener(
        "pagehide",
        onPageHide,
      );
    };
  }, [
    data.business.id,
    leadId,
    selectedProductId,
    sessionId,
  ]);

  function selectProduct(
    productId: string,
  ) {
    setSelectedProductId(
      productId,
    );

    document
      .getElementById(
        "lead-capture",
      )
      ?.scrollIntoView({
        behavior:
          "smooth",

        block:
          "center",
      });

    if (sessionId) {
      void trackPublicActivity({
        businessId:
          data.business.id,

        sessionId,

        leadId,

        productId,

        eventType:
          "PRODUCT_ENGAGED",

        pagePath:
          window.location.pathname,
      }).catch(
        () => undefined,
      );
    }
  }

  async function contact(
    channel:
      PublicContactChannel,
  ) {
    setContactError(
      null,
    );

    if (
      !sessionId ||
      !leadId
    ) {
      setContactError(
        "Please share your contact details first.",
      );

      document
        .getElementById(
          "lead-capture",
        )
        ?.scrollIntoView({
          behavior:
            "smooth",
        });

      return;
    }

    setContactLoading(
      channel,
    );

    try {
      const result =
        await createPublicContact({
          businessId:
            data.business.id,

          sessionId,

          leadId,

          productId:
            selectedProductId,

          channel,
        });

      if (
        result.url.startsWith(
          "http://",
        ) ||
        result.url.startsWith(
          "https://",
        )
      ) {
        window.open(
          result.url,
          "_blank",
          "noopener,noreferrer",
        );
      } else {
        window.open(
          result.url,
          "_self",
        );
      }
    } catch (caught) {
      setContactError(
        caught instanceof
          Error
          ? caught.message
          : "Unable to open this contact option.",
      );
    } finally {
      setContactLoading(
        null,
      );
    }
  }

  const location =
    [
      data.business.city,
      data.business.state,
      data.business.country,
    ]
      .filter(Boolean)
      .join(", ");

  return (
    <main className="min-h-screen bg-muted/20">
      {data.business.coverUrl ? (
        <div
          className="h-52 w-full bg-cover bg-center sm:h-72"
          style={{
            backgroundImage:
              `linear-gradient(to bottom, transparent, rgba(0,0,0,.45)), url("${data.business.coverUrl}")`,
          }}
        />
      ) : (
        <div className="h-32 bg-gradient-to-br from-primary/20 via-primary/5 to-background sm:h-48" />
      )}

      <div className="mx-auto w-full max-w-6xl px-5 pb-16 sm:px-8">
        <section className="-mt-14 rounded-3xl border bg-background p-6 shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div
              className="flex size-24 shrink-0 items-center justify-center rounded-2xl border bg-background bg-cover bg-center shadow-sm"
              style={
                data.business.logoUrl
                  ? {
                      backgroundImage:
                        `url("${data.business.logoUrl}")`,
                    }
                  : undefined
              }
            >
              {!data.business.logoUrl ? (
                <BriefcaseBusiness className="size-9 text-muted-foreground" />
              ) : null}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap gap-2">
                {data.business.category ? (
                  <Badge variant="secondary">
                    {
                      data.business.category
                    }
                  </Badge>
                ) : null}

                {data.business.businessType ? (
                  <Badge variant="outline">
                    {
                      data.business.businessType
                    }
                  </Badge>
                ) : null}
              </div>

              <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                {data.settings.headline ||
                  data.business.name}
              </h1>

              {data.settings.subheadline ? (
                <p className="mt-3 max-w-3xl text-lg leading-7 text-muted-foreground">
                  {
                    data.settings.subheadline
                  }
                </p>
              ) : null}

              {data.settings.showLocation &&
              location ? (
                <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="size-4" />
                  {location}
                </p>
              ) : null}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-10">
            {data.settings.about ||
            data.business.description ? (
              <section className="rounded-2xl border bg-background p-6">
                <h2 className="text-xl font-semibold">
                  About
                </h2>

                <p className="mt-4 whitespace-pre-line leading-7 text-muted-foreground">
                  {data.settings.about ||
                    data.business.description}
                </p>

                {data.settings.showLocation &&
                data.business.serviceArea ? (
                  <div className="mt-5 flex items-start gap-3 rounded-xl bg-muted/50 p-4">
                    <MapPin className="mt-0.5 size-4 shrink-0" />

                    <div>
                      <p className="text-sm font-medium">
                        Service area
                      </p>

                      <p className="mt-1 text-sm text-muted-foreground">
                        {
                          data.business.serviceArea
                        }
                      </p>
                    </div>
                  </div>
                ) : null}
              </section>
            ) : null}

            {data.settings.showProducts &&
            data.products.length >
              0 ? (
              <section>
                <div className="mb-5">
                  <p className="text-sm font-medium text-primary">
                    Explore
                  </p>

                  <h2 className="mt-1 text-2xl font-bold">
                    Products & services
                  </h2>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  {data.products.map(
                    (product) => {
                      const selected =
                        selectedProductId ===
                        product.id;

                      return (
                        <article
                          key={
                            product.id
                          }
                          className={[
                            "overflow-hidden rounded-2xl border bg-background transition",

                            selected
                              ? "border-primary ring-2 ring-primary/10"
                              : "",
                          ].join(
                            " ",
                          )}
                        >
                          <div className="p-5">
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="outline">
                                {product.itemType ===
                                "SERVICE"
                                  ? "Service"
                                  : "Product"}
                              </Badge>

                              {product.featured ? (
                                <Badge>
                                  <Star className="size-3" />
                                  Featured
                                </Badge>
                              ) : null}
                            </div>

                            <h3 className="mt-3 text-lg font-semibold">
                              {
                                product.name
                              }
                            </h3>

                            {product.description ? (
                              <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">
                                {
                                  product.description
                                }
                              </p>
                            ) : null}

                            {product.priceText ? (
                              <p className="mt-4 font-medium">
                                {
                                  product.priceText
                                }
                              </p>
                            ) : null}

                            <Button
                              type="button"
                              variant={
                                selected
                                  ? "default"
                                  : "outline"
                              }
                              className="mt-5 w-full"
                              onClick={() =>
                                selectProduct(
                                  product.id,
                                )
                              }
                            >
                              {selected
                                ? "Selected"
                                : "I'm interested"}
                            </Button>
                          </div>
                        </article>
                      );
                    },
                  )}
                </div>
              </section>
            ) : null}

            {data.settings.showBusinessHours &&
            data.hours.length >
              0 ? (
              <section className="rounded-2xl border bg-background p-6">
                <div className="flex items-center gap-2">
                  <Clock3 className="size-5" />

                  <h2 className="text-xl font-semibold">
                    Business hours
                  </h2>
                </div>

                <div className="mt-5 divide-y">
                  {data.hours.map(
                    (hour) => (
                      <div
                        key={
                          hour.dayOfWeek
                        }
                        className="flex items-center justify-between gap-5 py-3 text-sm"
                      >
                        <span className="font-medium">
                          {
                            dayNames[
                              hour.dayOfWeek
                            ]
                          }
                        </span>

                        <span className="text-muted-foreground">
                          {hour.isClosed
                            ? "Closed"
                            : `${hour.opensAt?.slice(
                                0,
                                5,
                              ) ?? ""} – ${hour.closesAt?.slice(
                                0,
                                5,
                              ) ?? ""}`}
                        </span>
                      </div>
                    ),
                  )}
                </div>
              </section>
            ) : null}

            {data.settings.showSocialLinks &&
            data.socials.length >
              0 ? (
              <section className="rounded-2xl border bg-background p-6">
                <div className="flex items-center gap-2">
                  <Share2 className="size-5" />

                  <h2 className="text-xl font-semibold">
                    Find us online
                  </h2>
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  {data.socials.map(
                    (social) => {
                      const supported =
                        [
                          "INSTAGRAM",
                          "FACEBOOK",
                          "LINKEDIN",
                        ].includes(
                          social.platform,
                        );

                      if (supported) {
                        return (
                          <Button
                            key={`${social.platform}-${social.url}`}
                            type="button"
                            variant="outline"
                            onClick={() =>
                              void contact(
                                social.platform as
                                  | "INSTAGRAM"
                                  | "FACEBOOK"
                                  | "LINKEDIN",
                              )
                            }
                          >
                            <Link2 className="size-4" />
                            {
                              social.label
                            }
                          </Button>
                        );
                      }

                      return (
                        <Button
                          key={`${social.platform}-${social.url}`}
                          asChild
                          variant="outline"
                        >
                          <a
                            href={
                              social.url
                            }
                            target="_blank"
                            rel="noreferrer"
                          >
                            <ExternalLink className="size-4" />

                            {
                              social.label
                            }
                          </a>
                        </Button>
                      );
                    },
                  )}
                </div>
              </section>
            ) : null}
          </div>

          <aside
            id="lead-capture"
            className="space-y-5 lg:sticky lg:top-6 lg:self-start"
          >
            <PublicLeadForm
              businessId={
                data.business.id
              }
              sessionId={
                sessionId
              }
              products={
                data.products
              }
              selectedProductId={
                selectedProductId
              }
              onProductChange={
                setSelectedProductId
              }
              onSessionReady={
                setSessionId
              }
              onCaptured={({
                leadId:
                  capturedLeadId,

                productId,
              }) => {
                setLeadId(
                  capturedLeadId,
                );

                window.sessionStorage.setItem(
                  `leadnexus:lead:${data.business.id}`,
                  capturedLeadId,
                );

                setSelectedProductId(
                  productId,
                );

                if (productId) {
                  window.sessionStorage.setItem(
                    `leadnexus:product:${data.business.id}`,
                    productId,
                  );
                } else {
                  window.sessionStorage.removeItem(
                    `leadnexus:product:${data.business.id}`,
                  );
                }
              }}
            />

            <div className="rounded-2xl border bg-background p-6 shadow-sm">
              <div>
                <h2 className="text-lg font-semibold">
                  {
                    data.settings.primaryCtaText
                  }
                </h2>

                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Submit your details
                  above, then choose how
                  you want to contact the
                  business.
                </p>
              </div>

              <div className="mt-5 grid gap-3">
                {data.settings.showWhatsapp &&
                data.contactAvailability.whatsapp ? (
                  <ContactButton
                    label="WhatsApp"
                    icon={
                      <MessageCircle className="size-4" />
                    }
                    loading={
                      contactLoading ===
                      "WHATSAPP"
                    }
                    onClick={() =>
                      void contact(
                        "WHATSAPP",
                      )
                    }
                  />
                ) : null}

                {data.settings.showPhone &&
                data.contactAvailability.phone ? (
                  <ContactButton
                    label="Call business"
                    icon={
                      <Phone className="size-4" />
                    }
                    loading={
                      contactLoading ===
                      "PHONE"
                    }
                    onClick={() =>
                      void contact(
                        "PHONE",
                      )
                    }
                  />
                ) : null}

                {data.settings.showEmail &&
                data.contactAvailability.email ? (
                  <ContactButton
                    label="Email business"
                    icon={
                      <Mail className="size-4" />
                    }
                    loading={
                      contactLoading ===
                      "EMAIL"
                    }
                    onClick={() =>
                      void contact(
                        "EMAIL",
                      )
                    }
                  />
                ) : null}

                {data.contactAvailability.website ? (
                  <ContactButton
                    label="Visit website"
                    icon={
                      <Globe2 className="size-4" />
                    }
                    loading={
                      contactLoading ===
                      "WEBSITE"
                    }
                    onClick={() =>
                      void contact(
                        "WEBSITE",
                      )
                    }
                  />
                ) : null}
              </div>

              {contactError ? (
                <p className="mt-4 text-sm text-destructive">
                  {contactError}
                </p>
              ) : null}
            </div>
          </aside>
        </div>

      </div>
    </main>
  );
}

function ContactButton({
  label,
  icon,
  loading,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full justify-start"
      disabled={loading}
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        icon
      )}

      {label}
    </Button>
  );
}
