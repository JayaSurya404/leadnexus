import type {
  ReactNode,
} from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

type AdminStatCardProps = {
  label: string;

  value:
    string | number;

  description:
    string;

  icon:
    ReactNode;
};

export function AdminStatCard({
  label,
  value,
  description,
  icon,
}: AdminStatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <div className="flex size-9 items-center justify-center rounded-lg bg-muted">
            {icon}
          </div>
        </div>

        <p className="mt-3 text-3xl font-bold">
          {value}
        </p>

        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}