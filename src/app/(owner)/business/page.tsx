import type {
  Metadata,
} from "next";

import {
  ExternalLink,
  Save,
} from "lucide-react";

import Link from "next/link";

import {
  updateBusinessAction,
} from "@/actions/business/update-business";

import {
  updateBusinessHoursAction,
} from "@/actions/business/update-hours";

import {
  updateSocialLinksAction,
} from "@/actions/business/update-social-links";

import {
  updatePublicPageAction,
} from "@/actions/business/update-public-page";

import {
  updateContactTemplatesAction,
} from "@/actions/business/update-contact-templates";

import {
  BrandUpload,
} from "@/components/business/brand-upload";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

import {
  requireOwner,
} from "@/lib/auth/require-owner";

import {
  createClient,
} from "@/lib/supabase/server";

export const metadata: Metadata = {
  title:
    "Business | LeadNexus",
};

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

function timeValue(
  value:
    | string
    | null,
) {
  if (!value) {
    return "";
  }

  return value.slice(
    0,
    5,
  );
}

export default async function BusinessPage() {
  const context =
    await requireOwner();

  const supabase =
    await createClient();

  const [
    businessResult,
    socialResult,
    hoursResult,
    publicResult,
    templateResult,
    logoResult,
    coverResult,
  ] = await Promise.all([
    supabase
      .from("businesses")
      .select(
        `
          id,
          name,
          slug,
          category,
          business_type,
          description,
          business_email,
          business_phone,
          whatsapp_number,
          website,
          address_line_1,
          address_line_2,
          city,
          state,
          country,
          postal_code,
          service_area
        `,
      )
      .eq(
        "id",
        context.business.id,
      )
      .single(),

    supabase
      .from(
        "business_social_links",
      )
      .select(
        "platform, url",
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .eq(
        "enabled",
        true,
      ),

    supabase
      .from(
        "business_hours",
      )
      .select(
        `
          day_of_week,
          is_closed,
          opens_at,
          closes_at
        `,
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .order(
        "day_of_week",
      ),

    supabase
      .from(
        "public_page_settings",
      )
      .select(
        `
          headline,
          subheadline,
          about_text,
          primary_cta_text,
          published,
          show_products,
          show_business_hours,
          show_social_links,
          show_location,
          show_phone,
          show_email,
          show_whatsapp
        `,
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .maybeSingle(),

    supabase
      .from(
        "contact_templates",
      )
      .select(
        "channel, message_template",
      )
      .eq(
        "business_id",
        context.business.id,
      )
      .is(
        "product_id",
        null,
      )
      .eq(
        "active",
        true,
      ),

    supabase.storage
      .from(
        "business-media",
      )
      .list(
        `${context.business.id}/logo`,
      ),

    supabase.storage
      .from(
        "business-media",
      )
      .list(
        `${context.business.id}/cover`,
      ),
  ]);

  const errors = [
    businessResult.error,
    socialResult.error,
    hoursResult.error,
    publicResult.error,
    templateResult.error,
  ].filter(Boolean);

  if (
    errors.length > 0
  ) {
    throw new Error(
      errors[0]?.message ??
      "Unable to load business settings.",
    );
  }

  const business =
  businessResult.data;

if (!business) {
  throw new Error(
    "Business record could not be found.",
  );
}

  const socialMap =
    new Map(
      (
        socialResult.data ??
        []
      ).map(
        (row) => [
          row.platform,
          row.url,
        ],
      ),
    );

  const hoursMap =
    new Map(
      (
        hoursResult.data ??
        []
      ).map(
        (row) => [
          row.day_of_week,
          row,
        ],
      ),
    );

  const settings =
    publicResult.data;

  const templates =
    templateResult.data ??
    [];

  const whatsappTemplate =
    templates.find(
      (template) =>
        template.channel ===
        "WHATSAPP",
    );

  const emailTemplate =
    templates.find(
      (template) =>
        template.channel ===
        "EMAIL",
    );

  const logoFile =
    logoResult.data?.find(
      (file) =>
        file.name ===
        "current",
    );

  const coverFile =
    coverResult.data?.find(
      (file) =>
        file.name ===
        "current",
    );

  const logoPublic =
    supabase.storage
      .from(
        "business-media",
      )
      .getPublicUrl(
        `${context.business.id}/logo/current`,
      ).data.publicUrl;

  const coverPublic =
    supabase.storage
      .from(
        "business-media",
      )
      .getPublicUrl(
        `${context.business.id}/cover/current`,
      ).data.publicUrl;

  const logoUrl =
    logoFile
      ? `${logoPublic}?v=${encodeURIComponent(
          logoFile.updated_at ??
            logoFile.created_at ??
            "",
        )}`
      : null;

  const coverUrl =
    coverFile
      ? `${coverPublic}?v=${encodeURIComponent(
          coverFile.updated_at ??
            coverFile.created_at ??
            "",
        )}`
      : null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Business
          </p>

          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            Business settings
          </h1>

          <p className="mt-2 text-muted-foreground">
            Manage everything visitors
            see about your business.
          </p>
        </div>

        <Button
          asChild
          variant="outline"
        >
          <Link
            href={`/b/${business.slug}`}
            target="_blank"
          >
            Public page
            <ExternalLink className="size-4" />
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            Branding
          </CardTitle>

          <CardDescription>
            Upload your logo and public
            page cover image.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-8 lg:grid-cols-2">
          <BrandUpload
            businessId={
              context.business.id
            }
            kind="logo"
            currentUrl={
              logoUrl
            }
          />

          <BrandUpload
            businessId={
              context.business.id
            }
            kind="cover"
            currentUrl={
              coverUrl
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Business profile
          </CardTitle>

          <CardDescription>
            Core business and contact
            information.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            action={
              updateBusinessAction
            }
            className="grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Business name"
              name="name"
              defaultValue={
                business.name
              }
              required
            />

            <Field
              label="Category"
              name="category"
              defaultValue={
                business.category ??
                ""
              }
              required
            />

            <Field
              label="Business type"
              name="businessType"
              defaultValue={
                business.business_type ??
                ""
              }
              required
            />

            <Field
              label="Business email"
              name="businessEmail"
              type="email"
              defaultValue={
                business.business_email ??
                ""
              }
            />

            <Field
              label="Business phone"
              name="businessPhone"
              type="tel"
              defaultValue={
                business.business_phone ??
                ""
              }
            />

            <Field
              label="WhatsApp number"
              name="whatsappNumber"
              type="tel"
              defaultValue={
                business.whatsapp_number ??
                ""
              }
            />

            <Field
              label="Website"
              name="website"
              type="url"
              defaultValue={
                business.website ??
                ""
              }
              placeholder="https://..."
            />

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">
                Description
              </Label>

              <Textarea
                id="description"
                name="description"
                rows={5}
                defaultValue={
                  business.description ??
                  ""
                }
                required
              />
            </div>

            <Field
              label="Address line 1"
              name="addressLine1"
              defaultValue={
                business.address_line_1 ??
                ""
              }
            />

            <Field
              label="Address line 2"
              name="addressLine2"
              defaultValue={
                business.address_line_2 ??
                ""
              }
            />

            <Field
              label="City"
              name="city"
              defaultValue={
                business.city ??
                ""
              }
            />

            <Field
              label="State"
              name="state"
              defaultValue={
                business.state ??
                ""
              }
            />

            <Field
              label="Country"
              name="country"
              defaultValue={
                business.country ??
                ""
              }
            />

            <Field
              label="Postal code"
              name="postalCode"
              defaultValue={
                business.postal_code ??
                ""
              }
            />

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="serviceArea">
                Service area
              </Label>

              <Input
                id="serviceArea"
                name="serviceArea"
                defaultValue={
                  business.service_area ??
                  ""
                }
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit">
                <Save className="size-4" />
                Save business
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Social links
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form
            action={
              updateSocialLinksAction
            }
            className="grid gap-5 sm:grid-cols-2"
          >
            <Field
              label="Instagram"
              name="instagramUrl"
              type="url"
              placeholder="https://..."
              defaultValue={
                socialMap.get(
                  "INSTAGRAM",
                ) ?? ""
              }
            />

            <Field
              label="Facebook"
              name="facebookUrl"
              type="url"
              placeholder="https://..."
              defaultValue={
                socialMap.get(
                  "FACEBOOK",
                ) ?? ""
              }
            />

            <Field
              label="LinkedIn"
              name="linkedinUrl"
              type="url"
              placeholder="https://..."
              defaultValue={
                socialMap.get(
                  "LINKEDIN",
                ) ?? ""
              }
            />

            <Field
              label="YouTube"
              name="youtubeUrl"
              type="url"
              placeholder="https://..."
              defaultValue={
                socialMap.get(
                  "YOUTUBE",
                ) ?? ""
              }
            />

            <Field
              label="X"
              name="xUrl"
              type="url"
              placeholder="https://..."
              defaultValue={
                socialMap.get(
                  "X",
                ) ?? ""
              }
            />

            <div className="sm:col-span-2">
              <Button type="submit">
                <Save className="size-4" />
                Save socials
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Business hours
          </CardTitle>

          <CardDescription>
            Check Closed for days when
            the business is unavailable.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            action={
              updateBusinessHoursAction
            }
            className="space-y-3"
          >
            {dayNames.map(
              (
                day,
                index,
              ) => {
                const row =
                  hoursMap.get(
                    index,
                  );

                return (
                  <div
                    key={day}
                    className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[150px_110px_1fr_1fr] sm:items-end"
                  >
                    <p className="font-medium">
                      {day}
                    </p>

                    <label className="flex h-9 items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        name={`closed_${index}`}
                        defaultChecked={
                          row
                            ?.is_closed ??
                          true
                        }
                        className="size-4 accent-primary"
                      />
                      Closed
                    </label>

                    <div className="space-y-1">
                      <Label>
                        Opens
                      </Label>

                      <Input
                        type="time"
                        name={`opens_${index}`}
                        defaultValue={timeValue(
                          row
                            ?.opens_at ??
                            null,
                        )}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label>
                        Closes
                      </Label>

                      <Input
                        type="time"
                        name={`closes_${index}`}
                        defaultValue={timeValue(
                          row
                            ?.closes_at ??
                            null,
                        )}
                      />
                    </div>
                  </div>
                );
              },
            )}

            <Button type="submit">
              <Save className="size-4" />
              Save hours
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Contact messages
          </CardTitle>

          <CardDescription>
            These messages are prepared
            for visitors; LeadNexus does
            not pretend they were sent.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            action={
              updateContactTemplatesAction
            }
            className="space-y-5"
          >
            <div className="space-y-2">
              <Label htmlFor="whatsappMessage">
                WhatsApp message
              </Label>

              <Textarea
                id="whatsappMessage"
                name="whatsappMessage"
                rows={5}
                defaultValue={
                  whatsappTemplate
                    ?.message_template ??
                  "Hi {{business_name}}, I'm interested in {{product_name}}. Could you please share more information?"
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="emailMessage">
                Email message
              </Label>

              <Textarea
                id="emailMessage"
                name="emailMessage"
                rows={5}
                defaultValue={
                  emailTemplate
                    ?.message_template ??
                  ""
                }
              />
            </div>

            <Button type="submit">
              <Save className="size-4" />
              Save templates
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Public page
          </CardTitle>

          <CardDescription>
            Control what visitors see on
            your LeadNexus business page.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form
            action={
              updatePublicPageAction
            }
            className="space-y-6"
          >
            <Field
              label="Headline"
              name="headline"
              defaultValue={
                settings?.headline ??
                ""
              }
            />

            <Field
              label="Subheadline"
              name="subheadline"
              defaultValue={
                settings?.subheadline ??
                ""
              }
            />

            <div className="space-y-2">
              <Label htmlFor="about">
                About
              </Label>

              <Textarea
                id="about"
                name="about"
                rows={5}
                defaultValue={
                  settings?.about_text ??
                  ""
                }
              />
            </div>

            <Field
              label="Primary CTA"
              name="primaryCtaText"
              defaultValue={
                settings
                  ?.primary_cta_text ??
                "Get in touch"
              }
              required
            />

            <div className="grid gap-3 sm:grid-cols-2">
              <CheckboxField
                name="published"
                label="Publish page"
                checked={
                  settings
                    ?.published ??
                  true
                }
              />

              <CheckboxField
                name="showProducts"
                label="Show products"
                checked={
                  settings
                    ?.show_products ??
                  true
                }
              />

              <CheckboxField
                name="showBusinessHours"
                label="Show business hours"
                checked={
                  settings
                    ?.show_business_hours ??
                  true
                }
              />

              <CheckboxField
                name="showSocialLinks"
                label="Show social links"
                checked={
                  settings
                    ?.show_social_links ??
                  true
                }
              />

              <CheckboxField
                name="showLocation"
                label="Show location"
                checked={
                  settings
                    ?.show_location ??
                  true
                }
              />

              <CheckboxField
                name="showPhone"
                label="Show phone"
                checked={
                  settings
                    ?.show_phone ??
                  true
                }
              />

              <CheckboxField
                name="showEmail"
                label="Show email"
                checked={
                  settings
                    ?.show_email ??
                  true
                }
              />

              <CheckboxField
                name="showWhatsapp"
                label="Show WhatsApp"
                checked={
                  settings
                    ?.show_whatsapp ??
                  true
                }
              />
            </div>

            <Button type="submit">
              <Save className="size-4" />
              Save public page
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  placeholder,
  required = false,
}: {
  label: string;
  name: string;
  defaultValue:
    | string
    | null;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
      </Label>

      <Input
        id={name}
        name={name}
        type={type}
        defaultValue={
          defaultValue ??
          ""
        }
        placeholder={
          placeholder
        }
        required={required}
      />
    </div>
  );
}

function CheckboxField({
  name,
  label,
  checked,
}: {
  name: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex items-center gap-3 rounded-lg border p-4 text-sm font-medium">
      <input
        type="checkbox"
        name={name}
        defaultChecked={
          checked
        }
        className="size-4 accent-primary"
      />

      {label}
    </label>
  );
}