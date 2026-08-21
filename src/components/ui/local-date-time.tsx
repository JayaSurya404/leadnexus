"use client";

import {
  useSyncExternalStore,
} from "react";

import {
  formatLocalDateTime,
} from "@/lib/format-local-date-time";

type LocalDateTimeProps = {
  value: string;
};

function subscribe() {
  return () => undefined;
}

export function LocalDateTime({
  value,
}: LocalDateTimeProps) {
  const formatted =
    useSyncExternalStore(
      subscribe,
      () =>
        formatLocalDateTime(
          value,
        ),
      () => null,
    );

  return (
    <time dateTime={value}>
      {formatted ?? "—"}
    </time>
  );
}
