export function formatLocalDateTime(
  value: string,
  locale?: string,
  timeZone?: string,
) {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime(),
    )
  ) {
    return "Invalid date";
  }

  return new Intl.DateTimeFormat(
    locale,
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      ...(timeZone
        ? {
            timeZone,
          }
        : {}),
    },
  ).format(date);
}
