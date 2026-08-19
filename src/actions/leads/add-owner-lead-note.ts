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
  formData: FormData,
) {
  const context =
    await requireOwner();

  const note =
    getNote(formData);

  if (
    note.length < 1
  ) {
    throw new Error(
      "Write a note first.",
    );
  }

  if (
    note.length > 2000
  ) {
    throw new Error(
      "Note is too long.",
    );
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
    throw new Error(
      "Lead could not be found.",
    );
  }

  // Insert with the exact columns matching the lead_notes schema:
  //   id, lead_id, author_user_id, note, created_at, updated_at
  const {
    error: insertError,
  } = await supabase
    .from("lead_notes")
    .insert({
      lead_id: leadId,
      author_user_id: context.userId,
      note,
    });

  if (insertError) {
    throw new Error(
      `Unable to add note: ${insertError.message}`,
    );
  }

  revalidatePath(
    `/leads/${leadId}`,
  );
}