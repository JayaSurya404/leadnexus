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

function text(
  formData: FormData,
  name: string,
) {
  const value =
    formData.get(name);

  return typeof value ===
    "string"
    ? value
    : "";
}

export async function updateBusinessHoursAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const rows =
    Array.from(
      {
        length: 7,
      },
      (_, day) => {
        const closed =
          formData.get(
            `closed_${day}`,
          ) === "on";

        const opensAt =
          text(
            formData,
            `opens_${day}`,
          );

        const closesAt =
          text(
            formData,
            `closes_${day}`,
          );

        if (
          !closed &&
          (
            !/^\d{2}:\d{2}$/.test(
              opensAt,
            ) ||
            !/^\d{2}:\d{2}$/.test(
              closesAt,
            )
          )
        ) {
          throw new Error(
            "Opening and closing times are required for every open day.",
          );
        }

        return {
          business_id:
            context.business.id,

          day_of_week:
            day,

          is_closed:
            closed,

          opens_at:
            closed
              ? null
              : opensAt,

          closes_at:
            closed
              ? null
              : closesAt,
        };
      },
    );

  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from(
        "business_hours",
      )
      .upsert(
        rows,
        {
          onConflict:
            "business_id,day_of_week",
        },
      );

  if (error) {
    throw new Error(
      `Unable to save business hours: ${error.message}`,
    );
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}