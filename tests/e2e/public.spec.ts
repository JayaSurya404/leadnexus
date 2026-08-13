import {
  expect,
  test,
} from "@playwright/test";

test(
  "health endpoint is healthy",
  async ({
    request,
  }) => {
    const response =
      await request.get(
        "/api/health",
      );

    expect(
      response.ok(),
    ).toBe(true);

    const body =
      await response.json();

    expect(
      body.status,
    ).toBe(
      "ok",
    );

    expect(
      body.service,
    ).toBe(
      "leadnexus",
    );
  },
);

test(
  "landing page loads",
  async ({
    page,
  }) => {
    await page.goto(
      "/",
    );

    await expect(
      page.getByRole(
        "heading",
        {
          name:
            /Turn business traffic into actionable leads/i,
        },
      ),
    ).toBeVisible();

    await expect(
      page.getByRole(
        "link",
        {
          name:
            /Create your business page/i,
        },
      ),
    ).toBeVisible();
  },
);

test(
  "demo public business page loads",
  async ({
    page,
  }) => {
    await page.goto(
      "/b/aurora-digital-studio",
    );

    await expect(
      page.getByText(
        "Aurora Digital Studio",
      ).first(),
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
  },
);

test(
  "tracking link reaches demo business",
  async ({
    page,
  }) => {
    await page.goto(
      "/l/demoig01",
    );

    await page.waitForURL(
      /\/b\/aurora-digital-studio/,
    );

    await expect(
      page.getByText(
        "Aurora Digital Studio",
      ).first(),
    ).toBeVisible();
  },
);

test(
  "protected owner route redirects anonymous user",
  async ({
    page,
  }) => {
    await page.goto(
      "/dashboard",
    );

    await page.waitForURL(
      /\/login/,
    );

    await expect(
      page.getByLabel(
        "Email",
      ),
    ).toBeVisible();
  },
);

test.describe(
  "mobile smoke",
  () => {
    test.use({
      viewport: {
        width:
          390,

        height:
          844,
      },
    });

    test(
      "public business page works on mobile",
      async ({
        page,
      }) => {
        await page.goto(
          "/b/aurora-digital-studio",
        );

        await expect(
          page.getByText(
            "Aurora Digital Studio",
          ).first(),
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
      },
    );
  },
);