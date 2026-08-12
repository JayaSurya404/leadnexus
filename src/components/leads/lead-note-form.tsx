import {
  Plus,
} from "lucide-react";

import {
  addOwnerLeadNoteAction,
} from "@/actions/leads/add-owner-lead-note";

import {
  Button,
} from "@/components/ui/button";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

type LeadNoteFormProps = {
  leadId: string;
};

export function LeadNoteForm({
  leadId,
}: LeadNoteFormProps) {
  const action =
    addOwnerLeadNoteAction.bind(
      null,
      leadId,
    );

  return (
    <form
      action={action}
      className="space-y-3"
    >
      <Label htmlFor="note">
        Add note
      </Label>

      <Textarea
        id="note"
        name="note"
        rows={4}
        maxLength={2000}
        placeholder="Write a follow-up note about this lead..."
        required
      />

      <Button type="submit">
        <Plus className="size-4" />
        Add note
      </Button>
    </form>
  );
}