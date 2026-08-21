"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createClient,
} from "@/lib/supabase/server";

export type LeadNoteActionState = {
  status:
    | "idle"
    | "success"
    | "error";

  message?: string;
};

function getNote(
  formData: FormData,
) {
  const value =
    formData.get("note");

  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
}

export async function addOwnerLeadNoteAction(
  leadId: string,
  previousState:
    LeadNoteActionState,
  formData: FormData,
) : Promise<LeadNoteActionState> {
  void previousState;

  const context =
    await requireOwner();

  const note =
    getNote(formData);

  if (
    note.length < 1
  ) {
    return {
      status: "error",
      message:
        "Write a note first.",
    };
  }

  if (
    note.length > 2000
  ) {
    return {
      status: "error",
      message:
        "Note is too long.",
    };
  }

  const supabase =
    await createClient();

  // Verify the lead belongs to this business and is visible
  const {
    data: lead,
    error: leadError,
  } = await supabase
    .from("leads")
    .select("id")
    .eq(
      "id",
      leadId,
    )
    .eq(
      "business_id",
      context.business.id,
    )
    .eq(
      "visibility",
      "OWNER_VISIBLE",
    )
    .is(
      "archived_at",
      null,
    )
    .maybeSingle();

  if (
    leadError ||
    !lead
  ) {
    return {
      status: "error",
      message:
        "Lead could not be found.",
    };
  }

  const {
    error: insertError,
  } = await supabase
    .from("lead_notes")
    .insert({
      business_id:
        context.business.id,

      lead_id: leadId,
      author_user_id: context.userId,
      note,
    });

  if (insertError) {
    console.error(
      "LeadNexus note save failed:",
      insertError.code,
    );

    return {
      status: "error",
      message:
        "Unable to save this note. Your text is still available; please try again.",
    };
  }

  revalidatePath(
    `/leads/${leadId}`,
  );

  return {
    status: "success",
    message:
      "Note saved.",
  };
}
