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

import {
  businessProfileSchema,
} from "@/lib/validation/business";

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

function nullable(
  value: string,
) {
  const result =
    value.trim();

  return result
    ? result
    : null;
}

export async function updateBusinessAction(
  formData: FormData,
) {
  const context =
    await requireOwner();

  const parsed =
    businessProfileSchema.safeParse(
      {
        name: text(
          formData,
          "name",
        ),

        category: text(
          formData,
          "category",
        ),

        businessType: text(
          formData,
          "businessType",
        ),

        description: text(
          formData,
          "description",
        ),

        businessEmail: text(
          formData,
          "businessEmail",
        ),

        businessPhone: text(
          formData,
          "businessPhone",
        ),

        whatsappNumber: text(
          formData,
          "whatsappNumber",
        ),

        website: text(
          formData,
          "website",
        ),

        addressLine1: text(
          formData,
          "addressLine1",
        ),

        addressLine2: text(
          formData,
          "addressLine2",
        ),

        city: text(
          formData,
          "city",
        ),

        state: text(
          formData,
          "state",
        ),

        country: text(
          formData,
          "country",
        ),

        postalCode: text(
          formData,
          "postalCode",
        ),

        serviceArea: text(
          formData,
          "serviceArea",
        ),
      },
    );

  if (!parsed.success) {
    throw new Error(
      parsed.error.issues[0]
        ?.message ??
        "Invalid business information.",
    );
  }

  const value =
    parsed.data;

  const supabase =
    await createClient();

  const { error } =
    await supabase
      .from("businesses")
      .update({
        name:
          value.name,

        category:
          value.category,

        business_type:
          value.businessType,

        description:
          value.description,

        business_email:
          nullable(
            value.businessEmail,
          ),

        business_phone:
          nullable(
            value.businessPhone,
          ),

        whatsapp_number:
          nullable(
            value.whatsappNumber,
          ),

        website:
          nullable(
            value.website,
          ),

        address_line_1:
          nullable(
            value.addressLine1,
          ),

        address_line_2:
          nullable(
            value.addressLine2,
          ),

        city:
          nullable(
            value.city,
          ),

        state:
          nullable(
            value.state,
          ),

        country:
          nullable(
            value.country,
          ),

        postal_code:
          nullable(
            value.postalCode,
          ),

        service_area:
          nullable(
            value.serviceArea,
          ),
      })
      .eq(
        "id",
        context.business.id,
      );

  if (error) {
    throw new Error(
      `Unable to update business: ${error.message}`,
    );
  }

  revalidatePath(
    "/business",
  );

  revalidatePath(
    "/dashboard",
  );

  revalidatePath(
    `/b/${context.business.slug}`,
  );
}