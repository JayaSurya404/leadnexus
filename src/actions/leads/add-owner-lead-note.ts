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

  const {
    data: lead,
    error:
      leadError,
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

  /*
   * The original LeadNexus schema was
   * created before this UI phase.
   *
   * This supports the common note/author
   * field variants without changing the
   * deployed database.
   */

  const noteColumns = [
    "note",
    "note_text",
    "body",
    "content",
  ] as const;

  const authorColumns = [
    "author_user_id",
    "author_id",
    "created_by",
    null,
  ] as const;

  let lastError:
    string | null =
      null;

  let inserted =
    false;

  for (
    const noteColumn of
      noteColumns
  ) {
    for (
      const authorColumn of
        authorColumns
    ) {
      const payload:
        Record<
          string,
          unknown
        > = {
        business_id:
          context.business.id,

        lead_id:
          leadId,

        [noteColumn]:
          note,
      };

      if (
        authorColumn
      ) {
        payload[
          authorColumn
        ] =
          context.userId;
      }

      const {
        error:
          insertError,
      } = await supabase
        .from(
          "lead_notes",
        )
        .insert(
          payload,
        );

      if (!insertError) {
        inserted =
          true;

        break;
      }

      lastError =
        insertError.message;
    }

    if (inserted) {
      break;
    }
  }

  if (!inserted) {
    throw new Error(
      lastError
        ? `Unable to add note: ${lastError}`
        : "Unable to add note.",
    );
  }

  revalidatePath(
    `/leads/${leadId}`,
  );
}