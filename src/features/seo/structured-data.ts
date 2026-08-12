import type {
  PublicBusinessPageData,
} from "@/types/public-business";

export function buildBusinessStructuredData(
  data: PublicBusinessPageData,
  canonicalUrl: string,
) {
  const description =
    data.settings.about ||
    data.settings.subheadline ||
    data.business.description ||
    undefined;

  const hasAddress =
    Boolean(
      data.business.city ||
        data.business.state ||
        data.business.country,
    );

  const address =
    hasAddress
      ? {
          "@type":
            "PostalAddress",

          addressLocality:
            data.business.city ||
            undefined,

          addressRegion:
            data.business.state ||
            undefined,

          addressCountry:
            data.business.country ||
            undefined,
        }
      : undefined;

  const socialUrls =
    data.socials
      .map(
        (social) =>
          social.url,
      )
      .filter(
        (url) =>
          /^https?:\/\//i.test(
            url,
          ),
      );

  const offers =
    data.products.map(
      (product) => ({
        "@type":
          "Offer",

        itemOffered: {
          "@type":
            product.itemType ===
            "SERVICE"
              ? "Service"
              : "Product",

          name:
            product.name,

          description:
            product.description ||
            undefined,

          image:
            product.imageUrl ||
            undefined,

          url:
            canonicalUrl,
        },
      }),
    );

  return {
    "@context":
      "https://schema.org",

    "@type":
      "LocalBusiness",

    "@id":
      `${canonicalUrl}#business`,

    name:
      data.business.name,

    url:
      canonicalUrl,

    description,

    image:
      data.business.coverUrl ||
      data.business.logoUrl ||
      undefined,

    logo:
      data.business.logoUrl ||
      undefined,

    address,

    areaServed:
      data.business.serviceArea ||
      undefined,

    sameAs:
      socialUrls.length > 0
        ? socialUrls
        : undefined,

    makesOffer:
      offers.length > 0
        ? offers
        : undefined,
  };
}

export function serializeJsonLd(
  value: unknown,
) {
  return JSON.stringify(
    value,
  ).replace(
    /</g,
    "\\u003c",
  );
}