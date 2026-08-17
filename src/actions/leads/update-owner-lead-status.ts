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

import type {
  LeadStatus,
} from "@/types/leads";

const statuses =
  new Set<LeadStatus>([
    "NEW",
    "CONTACTED",
    "RESPONDED",
    "QUALIFIED",
    "CUSTOMER",
    "NO_RESPONSE",
    "NOT_INTERESTED",
    "LOST",
  ]);

export async function updateOwnerLeadStatusAction(
  leadId: string,
  formData: FormData,
) {
  const context =
    await requireOwner();

  const value =
    formData.get(
      "status",
    );

  if (
    typeof value !==
      "string" ||
    !statuses.has(
      value as LeadStatus,
    )
  ) {
    throw new Error(
      "Invalid lead status.",
    );
  }

  const status =
    value as LeadStatus;

  const doNotCall =
    formData.get("doNotCall") === "on";

  const supabase =
    await createClient();

  const {
    data: updated,
    error,
  } = await supabase
    .from("leads")
    .update({
      status,
      do_not_call: doNotCall,
    })
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
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to update lead: ${error.message}`,
    );
  }

  if (!updated) {
    throw new Error(
      "Lead could not be found.",
    );
  }

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/leads",
  );

  revalidatePath(
    `/leads/${leadId}`,
  );

  revalidatePath(
    "/recovered-leads",
  );
}
