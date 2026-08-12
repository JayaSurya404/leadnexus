"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireAdmin,
} from "@/lib/auth/require-admin";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export async function intelligenceAnalyzeLead(
  formData: FormData,
) {
  await requireAdmin();

  const leadIdValue =
    formData.get("leadId");

  if (
    typeof leadIdValue !== "string" ||
    !leadIdValue.trim()
  ) {
    throw new Error(
      "Lead ID is required.",
    );
  }

  const leadId =
    leadIdValue.trim();

  const supabase =
    createAdminClient();

  const {
    data: lead,
    error: leadError,
  } = await supabase
    .from("leads")
    .select(
      "id, business_id",
    )
    .eq(
      "id",
      leadId,
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

  const {
    error,
  } = await supabase.rpc(
    "analyze_lead_rules",
    {
      p_lead_id:
        lead.id,
    },
  );

  if (error) {
    throw new Error(
      `Unable to refresh lead intelligence: ${error.message}`,
    );
  }

  revalidatePath(
    "/admin",
  );

  revalidatePath(
    "/admin/intelligence",
  );

  revalidatePath(
    "/admin/leads",
  );

  revalidatePath(
    `/admin/leads/${lead.id}`,
  );

  revalidatePath(
    "/admin/recovery",
  );

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    "/leads",
  );
}