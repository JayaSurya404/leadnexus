import type {
  ReactNode,
} from "react";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

type MetricCardProps = {
  label: string;
  value: number;
  description: string;
  icon: ReactNode;
};

export function MetricCard({
  label,
  value,
  description,
  icon,
}: MetricCardProps) {
  return (
    <Card className="border-border/60">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {label}
            </p>

            <p className="mt-2 text-3xl font-bold tracking-tight">
              {value.toLocaleString()}
            </p>
          </div>

          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          {description}
        </p>
      </CardContent>
    </Card>
  );
}