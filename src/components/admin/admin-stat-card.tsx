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

  accent?:
    | "blue"
    | "violet"
    | "orange"
    | "amber"
    | "emerald"
    | "slate";
};

const accentClasses = {
  blue:
    "bg-blue-500/10 text-blue-600",
  violet:
    "bg-violet-500/10 text-violet-600",
  orange:
    "bg-orange-500/10 text-orange-600",
  amber:
    "bg-amber-500/10 text-amber-700",
  emerald:
    "bg-emerald-500/10 text-emerald-600",
  slate:
    "bg-slate-500/10 text-slate-600",
} as const;

export function AdminStatCard({
  label,
  value,
  description,
  icon,
  accent = "slate",
}: AdminStatCardProps) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {label}
          </p>

          <div
            className={`flex size-10 items-center justify-center rounded-xl ${accentClasses[accent]}`}
          >
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
