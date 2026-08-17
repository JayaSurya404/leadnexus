import {
  Save,
} from "lucide-react";

import {
  updateOwnerLeadStatusAction,
} from "@/actions/leads/update-owner-lead-status";

import {
  Button,
} from "@/components/ui/button";

import {
  Label,
} from "@/components/ui/label";

import type {
  LeadStatus,
} from "@/types/leads";

const statuses: Array<{
  value: LeadStatus;
  label: string;
}> = [
  {
    value: "NEW",
    label: "New",
  },

  {
    value: "CONTACTED",
    label: "Contacted",
  },

  {
    value: "RESPONDED",
    label: "Responded",
  },

  {
    value: "QUALIFIED",
    label: "Qualified",
  },

  {
    value: "CUSTOMER",
    label: "Customer",
  },

  {
    value: "NO_RESPONSE",
    label: "No response",
  },

  {
    value: "NOT_INTERESTED",
    label: "Not interested",
  },

  {
    value: "LOST",
    label: "Lost",
  },
];

type LeadStatusFormProps = {
  leadId: string;

  currentStatus:
    LeadStatus;

  doNotCall: boolean;
};

export function LeadStatusForm({
  leadId,
  currentStatus,
  doNotCall,
}: LeadStatusFormProps) {
  const action =
    updateOwnerLeadStatusAction.bind(
      null,
      leadId,
    );

  return (
    <form
      action={action}
      className="space-y-3"
    >
      <Label htmlFor="lead-status">
        Lead status
      </Label>

      <select
        id="lead-status"
        name="status"
        defaultValue={
          currentStatus
        }
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      >
        {statuses.map(
          (status) => (
            <option
              key={
                status.value
              }
              value={
                status.value
              }
            >
              {
                status.label
              }
            </option>
          ),
        )}
      </select>

      <label className="flex items-start gap-2 rounded-lg border p-3 text-sm">
        <input type="checkbox" name="doNotCall" defaultChecked={doNotCall} className="mt-0.5 size-4" />
        <span><span className="font-medium">Do not call</span><span className="mt-1 block text-xs text-muted-foreground">Preserved in every VoiceNexus handoff and blocks calling there.</span></span>
      </label>

      <Button
        type="submit"
        className="w-full"
      >
        <Save className="size-4" />
        Update status
      </Button>
    </form>
  );
}
