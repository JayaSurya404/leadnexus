import {
  readFileSync,
} from "node:fs";

import {
  describe,
  expect,
  it,
} from "vitest";

describe(
  "lead UI fixes",
  () => {
    it(
      "keeps business branding but omits public product images",
      () => {
        const source =
          readFileSync(
            new URL(
              "../../src/components/public-business/public-business-page.tsx",
              import.meta.url,
            ),
            "utf8",
          );

        expect(source).toContain(
          "data.business.logoUrl",
        );
        expect(source).toContain(
          "data.business.coverUrl",
        );
        expect(source).toContain(
          "product.name",
        );
        expect(source).not.toContain(
          "product.imageUrl",
        );
      },
    );

    it(
      "labels owner-visible hot intelligence as a Hot Lead",
      () => {
        const tableSource =
          readFileSync(
            new URL(
              "../../src/components/leads/owner-leads-table.tsx",
              import.meta.url,
            ),
            "utf8",
          );

        const querySource =
          readFileSync(
            new URL(
              "../../src/features/leads/owner-lead-data.ts",
              import.meta.url,
            ),
            "utf8",
          );

        expect(tableSource).toContain(
          "Hot Lead",
        );
        expect(querySource).toMatch(
          /\.eq\(\s*"business_id",\s*businessId,\s*\)/,
        );
        expect(querySource).toMatch(
          /\.eq\(\s*"visibility",\s*"OWNER_VISIBLE",\s*\)/,
        );
      },
    );
  },
);
