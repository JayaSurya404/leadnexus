import {
  describe,
  expect,
  it,
} from "vitest";

import {
  buildEmailUrl,
  buildPhoneUrl,
  buildWhatsappUrl,
  renderContactTemplate,
} from "../../src/features/contact/message-template";

describe(
  "contact message utilities",
  () => {
    it(
      "renders business and product variables",
      () => {
        expect(
          renderContactTemplate(
            "Hi {{business_name}}, I am interested in {{product_name}}.",
            {
              businessName:
                "Acme",

              productName:
                "Website Development",
            },
          ),
        ).toBe(
          "Hi Acme, I am interested in Website Development.",
        );
      },
    );

    it(
      "builds WhatsApp URL",
      () => {
        expect(
          buildWhatsappUrl(
            "+91 98765 43210",
            "Hello there",
          ),
        ).toBe(
          "https://wa.me/919876543210?text=Hello%20there",
        );
      },
    );

    it(
      "builds email URL",
      () => {
        const url =
          buildEmailUrl({
            email:
              "owner@example.com",

            subject:
              "Product enquiry",

            message:
              "I need more information",
          });

        expect(
          url,
        ).toContain(
          "mailto:owner@example.com",
        );

        expect(
          url,
        ).toContain(
          "subject=Product%20enquiry",
        );
      },
    );

    it(
      "builds phone URL",
      () => {
        expect(
          buildPhoneUrl(
            "+91 98765 43210",
          ),
        ).toBe(
          "tel:+919876543210",
        );
      },
    );
  },
);