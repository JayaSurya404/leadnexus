import {
  Badge,
} from "@/components/ui/badge";

type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "RESPONDED"
  | "QUALIFIED"
  | "CUSTOMER"
  | "NO_RESPONSE"
  | "NOT_INTERESTED"
  | "LOST";

const labels:
  Record<
    LeadStatus,
    string
  > = {
  NEW: "New",

  CONTACTED:
    "Contacted",

  RESPONDED:
    "Responded",

  QUALIFIED:
    "Qualified",

  CUSTOMER:
    "Customer",

  NO_RESPONSE:
    "No response",

  NOT_INTERESTED:
    "Not interested",

  LOST:
    "Lost",
};

const classes:
  Record<
    LeadStatus,
    string
  > = {
  NEW:
    "border-blue-500/30 bg-blue-500/10 text-blue-700 dark:text-blue-300",

  CONTACTED:
    "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300",

  RESPONDED:
    "border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300",

  QUALIFIED:
    "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

  CUSTOMER:
    "border-green-600/30 bg-green-600/10 text-green-700 dark:text-green-300",

  NO_RESPONSE:
    "border-orange-500/30 bg-orange-500/10 text-orange-700 dark:text-orange-300",

  NOT_INTERESTED:
    "border-zinc-500/30 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300",

  LOST:
    "border-red-500/30 bg-red-500/10 text-red-700 dark:text-red-300",
};

type LeadStatusBadgeProps = {
  status:
    LeadStatus;
};

export function LeadStatusBadge({
  status,
}: LeadStatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={
        classes[status]
      }
    >
      {labels[status]}
    </Badge>
  );
}