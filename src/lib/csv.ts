export function escapeCsvCell(
  value: unknown,
) {
  const raw =
    value === null ||
    value === undefined
      ? ""
      : String(value);

  // Prevent spreadsheet formula injection when
  // a CSV is opened in Excel/Sheets.
  const safe =
    /^[=+\-@\t\r]/.test(
      raw,
    )
      ? `'${raw}`
      : raw;

  return `"${safe.replace(
    /"/g,
    '""',
  )}"`;
}

export function toCsv(
  rows: unknown[][],
) {
  return rows
    .map((row) =>
      row
        .map(
          escapeCsvCell,
        )
        .join(","),
    )
    .join("\r\n");
}