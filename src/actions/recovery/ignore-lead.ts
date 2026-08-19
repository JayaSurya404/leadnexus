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

export async function ignoreRecoveryLeadAction(
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
    "ignore_recovered_lead",
    {
      target_lead_id:
        leadId,
    },
  );

  if (error) {
    throw new Error(
      `Unable to ignore recovered lead: ${error.message}`,
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
}