import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildBusinessStructuredData,
  serializeJsonLd,
} from "../../src/features/seo/structured-data";

import type {
  PublicBusinessPageData,
} from "../../src/types/public-business";

const business:
  PublicBusinessPageData = {
    business: {
      id:
        "business-1",

      name:
        "Acme Digital",

      slug:
        "acme-digital",

      category:
        "Technology",

      businessType:
        "Agency",

      description:
        "Digital services for businesses.",

      city:
        "Coimbatore",

      state:
        "Tamil Nadu",

      country:
        "India",

      serviceArea:
        "Tamil Nadu",

      logoUrl:
        "https://example.com/logo.png",

      coverUrl:
        null,
    },

    settings: {
      headline:
        "Grow your business",

      subheadline:
        "Digital solutions",

      about:
        "Acme Digital provides digital services.",

      primaryCtaText:
        "Contact us",

      showProducts:
        true,

      showBusinessHours:
        true,

      showSocialLinks:
        true,

      showLocation:
        true,

      showPhone:
        true,

      showEmail:
        true,

      showWhatsapp:
        true,
    },

    products: [
      {
        id:
          "product-1",

        itemType:
          "SERVICE",

        name:
          "Website Development",

        slug:
          "website-development",

        description:
          "Professional website development.",

        priceText:
          null,

        featured:
          true,

        imageUrl:
          null,
      },
    ],

    socials: [
      {
        platform:
          "INSTAGRAM",

        label:
          "Instagram",

        url:
          "https://instagram.com/acme",
      },
    ],

    hours: [],

    contactAvailability: {
      whatsapp:
        true,

      email:
        true,

      phone:
        true,

      website:
        true,
    },
  };

describe(
  "SEO structured data",
  () => {
    it(
      "creates LocalBusiness JSON-LD",
      () => {
        const result =
          buildBusinessStructuredData(
            business,
            "https://leadnexus.app/b/acme-digital",
          );

        expect(
          result,
        ).toMatchObject({
          "@context":
            "https://schema.org",

          "@type":
            "LocalBusiness",

          name:
            "Acme Digital",

          url:
            "https://leadnexus.app/b/acme-digital",

          areaServed:
            "Tamil Nadu",
        });

        expect(
          JSON.stringify(
            result,
          ),
        ).toContain(
          "Website Development",
        );
      },
    );

    it(
      "escapes less-than characters before JSON-LD is inserted into HTML",
      () => {
        const result =
          serializeJsonLd({
            name:
              "</script>",
          });

        expect(
          result,
        ).not.toContain(
          "<",
        );

        expect(
          result,
        ).toContain(
          "\\u003c/script>",
        );
      },
    );
  },
);