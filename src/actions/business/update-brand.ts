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

type BrandKind =
  | "logo"
  | "cover";

function getPath(
  businessId: string,
  kind: BrandKind,
) {
  return `${businessId}/${kind}/current`;
}

export async function finalizeBrandUploadAction(
  kind: BrandKind,
) {
  const context =
    await requireOwner();

  const path =
    getPath(
      context.business.id,
      kind,
    );

  const supabase =
    await createClient();

  const folder =
    `${context.business.id}/${kind}`;

  const {
    data,
    error,
  } = await supabase.storage
    .from("business-media")
    .list(folder);

  if (error) {
    throw new Error(
      `Unable to verify uploaded image: ${error.message}`,
    );
  }

  const exists =
    data.some(
      (file) =>
        file.name ===
        "current",
    );

  if (!exists) {
    throw new Error(
      `Uploaded ${kind} could not be found at ${path}.`,
    );
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}

export async function removeBrandImageAction(
  kind: BrandKind,
) {
  const context =
    await requireOwner();

  const supabase =
    await createClient();

  const path =
    getPath(
      context.business.id,
      kind,
    );

  const { error } =
    await supabase.storage
      .from(
        "business-media",
      )
      .remove([
        path,
      ]);

  if (error) {
    throw new Error(
      `Unable to remove ${kind}: ${error.message}`,
    );
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}