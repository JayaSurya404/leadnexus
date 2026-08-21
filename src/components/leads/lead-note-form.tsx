"use client";

import {
  useActionState,
  useEffect,
  useRef,
} from "react";

import {
  Loader2,
  Plus,
} from "lucide-react";

import {
  toast,
} from "sonner";

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

  const [
    state,
    formAction,
    pending,
  ] = useActionState(
    action,
    {
      status:
        "idle",
    },
  );

  const formRef =
    useRef<HTMLFormElement>(
      null,
    );

  useEffect(() => {
    if (
      state.status ===
      "success"
    ) {
      formRef.current?.reset();
      toast.success(
        state.message ??
          "Note saved.",
      );
    }

    if (
      state.status ===
      "error"
    ) {
      toast.error(
        state.message ??
          "Unable to save the note.",
      );
    }
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
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

      {state.message ? (
        <p
          role="status"
          aria-live="polite"
          className={
            state.status ===
            "error"
              ? "text-sm text-destructive"
              : "text-sm text-emerald-600"
          }
        >
          {state.message}
        </p>
      ) : null}

      <Button
        type="submit"
        disabled={pending}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        {pending
          ? "Saving..."
          : "Add note"}
      </Button>
    </form>
  );
}
