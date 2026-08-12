"use server";

import {
  revalidatePath,
} from "next/cache";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createAdminClient,
} from "@/lib/supabase/admin";

export async function toggleTrackingLinkAction(
  linkId: string,
  nextActive: boolean,
  formData: FormData,
) {
  void formData;

  const context =
    await requireOwner();

  const supabase =
    createAdminClient();

  const {
    data,
    error,
  } = await supabase
    .from(
      "tracking_links",
    )
    .update({
      active:
        nextActive,

      updated_at:
        new Date()
          .toISOString(),
    })
    .eq(
      "id",
      linkId,
    )
    .eq(
      "business_id",
      context.business.id,
    )
    .select("id")
    .maybeSingle();

  if (error) {
    throw new Error(
      `Unable to update tracking link: ${error.message}`,
    );
  }

  if (!data) {
    throw new Error(
      "Tracking link could not be found.",
    );
  }

  revalidatePath(
    "/links",
  );
}