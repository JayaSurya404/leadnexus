import {
  describe,
  expect,
  it,
} from "vitest";

import {
  escapeCsvCell,
  toCsv,
} from "../../src/lib/csv";

describe(
  "CSV utilities",
  () => {
    it(
      "wraps normal values",
      () => {
        expect(
          escapeCsvCell(
            "Arivananth",
          ),
        ).toBe(
          '"Arivananth"',
        );
      },
    );

    it(
      "escapes quotes",
      () => {
        expect(
          escapeCsvCell(
            'ABC "Digital"',
          ),
        ).toBe(
          '"ABC ""Digital"""',
        );
      },
    );

    it(
      "neutralizes spreadsheet formulas",
      () => {
        expect(
          escapeCsvCell(
            "=SUM(A1:A2)",
          ),
        ).toBe(
          "\"'=SUM(A1:A2)\"",
        );
      },
    );

    it(
      "builds multiple CSV rows",
      () => {
        expect(
          toCsv([
            [
              "Name",
              "Status",
            ],
            [
              "Lead One",
              "NEW",
            ],
          ]),
        ).toBe(
          '"Name","Status"\r\n"Lead One","NEW"',
        );
      },
    );
  },
);