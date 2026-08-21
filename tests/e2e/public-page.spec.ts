import {
  expect,
  test,
} from "@playwright/test";

const businesses = [
  {
    slug: "aadhira-sungrid-energy",
    name: "Aadhira SunGrid Energy",
    product: "3kW Residential Rooftop Solar",
  },
  {
    slug: "aranya-living-spaces",
    name: "Aranya Living Spaces",
    product: "Modular Kitchen",
  },
  {
    slug: "velora-ev-mobility",
    name: "Velora EV Mobility",
    product: "Velora CityRide E2",
  },
];

for (const business of businesses) {
  test(
    `${business.name} exposes real business content and media`,
    async ({
      page,
    }) => {
      const sessionResponse = page.waitForResponse(
        (response) =>
          response.url().includes("/api/public/session") &&
          response.request().method() === "POST",
      );

      await page.goto(
        `/b/${business.slug}`,
      );

      const session = await sessionResponse;
      expect(
        session.status(),
        JSON.stringify({
          response: await session.text(),
          request: session.request().postDataJSON(),
        }),
      ).toBeLessThan(400);

      await expect(
        page.getByRole(
          "heading",
          {
            name:
              business.name,
          },
        ),
      ).toBeVisible();

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            "Products & services",
        },
      ),
    ).toBeVisible();

      await expect(
        page.getByText(
          business.product,
        ).first(),
      ).toBeVisible();

      await expect(
        page.getByRole(
          "heading",
          {
            name:
              "Business hours",
          },
        ),
      ).toBeVisible();

      await expect(
        page.getByRole(
          "heading",
          {
            name:
              "Interested?",
          },
        ),
      ).toBeVisible();

      await expect(
        page.locator('[style*="cover.svg"]').first(),
      ).toBeVisible();

      await expect(
        page.getByText(
          "Powered by LeadNexus",
        ),
      ).toHaveCount(0);
    },
  );
}
