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

export async function sendLeadToOwnerAction(
  leadId: string,
  formData: FormData,
) {
  void formData;

  await requireAdmin();

  const supabase =
    createAdminClient();

  const {
    error,
  } = await supabase.rpc(
    "send_recovered_lead_to_owner",
    {
      target_lead_id:
        leadId,
    },
  );

  if (error) {
    throw new Error(
      `Unable to send recovered lead: ${error.message}`,
    );
  }

  revalidatePath(
    "/admin",
  );

  revalidatePath(
    "/admin/recovery",
  );

  revalidatePath(
    "/admin/leads",
  );

  revalidatePath(
    `/admin/leads/${leadId}`,
  );

  revalidatePath(
    "/recovered-leads",
  );

  revalidatePath(
    "/leads",
  );

  revalidatePath(
    "/dashboard",
  );
}