"use client";

import {
  useState,
  useTransition,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  FormProvider,
  type FieldPath,
  useForm,
} from "react-hook-form";

import {
  zodResolver,
} from "@hookform/resolvers/zod";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
} from "lucide-react";

import {
  completeOnboardingAction,
} from "@/actions/onboarding/complete-onboarding";

import {
  onboardingSchema,
  type OnboardingInput,
} from "@/lib/validation/onboarding";

import {
  Button,
} from "@/components/ui/button";

import {
  Card,
  CardContent,
} from "@/components/ui/card";

import {
  OnboardingProgress,
} from "@/components/onboarding/onboarding-progress";

import {
  OwnerStep,
} from "@/components/onboarding/owner-step";

import {
  BusinessStep,
} from "@/components/onboarding/business-step";

import {
  LocationStep,
} from "@/components/onboarding/location-step";

import {
  SocialStep,
} from "@/components/onboarding/social-step";

import {
  HoursStep,
} from "@/components/onboarding/hours-step";

import {
  ProductsStep,
} from "@/components/onboarding/products-step";

import {
  ContactTemplateStep,
} from "@/components/onboarding/contact-template-step";

import {
  PublicPageStep,
} from "@/components/onboarding/public-page-step";

import {
  ReviewStep,
} from "@/components/onboarding/review-step";

const labels = [
  "Owner",
  "Business",
  "Location",
  "Social",
  "Hours",
  "Products",
  "Contact",
  "Public page",
  "Review",
] as const;

const stepFields: Array<
  Array<
    FieldPath<OnboardingInput>
  >
> = [
  [
    "ownerFullName",
    "ownerPhone",
  ],

  [
    "businessName",
    "category",
    "businessType",
    "businessDescription",
    "businessEmail",
    "businessPhone",
    "whatsappNumber",
    "website",
  ],

  [
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "country",
    "postalCode",
    "serviceArea",
  ],

  [
    "instagramUrl",
    "facebookUrl",
    "linkedinUrl",
    "youtubeUrl",
    "xUrl",
  ],

  [
    "hours",
  ],

  [
    "products",
  ],

  [
    "whatsappMessage",
    "emailMessage",
  ],

  [
    "publicHeadline",
    "publicSubheadline",
    "publicAbout",
    "primaryCtaText",
    "publicPublished",
    "showProducts",
    "showBusinessHours",
    "showSocialLinks",
    "showLocation",
    "showPhone",
    "showEmail",
    "showWhatsapp",
  ],

  [],
];

type OnboardingWizardProps = {
  initialProfile: {
    fullName: string;
    phone: string;
    email: string;
  };
};

export default function OnboardingWizard({
  initialProfile,
}: OnboardingWizardProps) {
  const router =
    useRouter();

  const [
    step,
    setStep,
  ] = useState(0);

  const [
    serverError,
    setServerError,
  ] =
    useState<string | null>(
      null,
    );

  const [
    pending,
    startTransition,
  ] = useTransition();

  const form =
    useForm<OnboardingInput>({
      resolver:
        zodResolver(
          onboardingSchema,
        ),

      mode: "onTouched",

      defaultValues: {
        ownerFullName:
          initialProfile.fullName,

        ownerPhone:
          initialProfile.phone,

        businessName: "",

        category: "",

        businessType: "",

        businessDescription:
          "",

        businessEmail:
          initialProfile.email,

        businessPhone:
          initialProfile.phone,

        whatsappNumber:
          initialProfile.phone,

        website: "",

        addressLine1: "",

        addressLine2: "",

        city: "",

        state: "",

        country: "India",

        postalCode: "",

        serviceArea: "",

        instagramUrl: "",

        facebookUrl: "",

        linkedinUrl: "",

        youtubeUrl: "",

        xUrl: "",

        hours: Array.from(
          {
            length: 7,
          },
          (
            _,
            index,
          ) => ({
            dayOfWeek:
              index,

            isClosed: true,

            opensAt: "",

            closesAt: "",
          }),
        ),

        products: [
          {
            itemType:
              "PRODUCT",

            name: "",

            description:
              "",

            priceText:
              "",
          },
        ],

        whatsappMessage:
          "Hi {{business_name}}, I'm interested in {{product_name}}. Could you please share more information?",

        emailMessage:
          "Hello {{business_name}}, I'm interested in {{product_name}}. Please share more information.",

        publicHeadline:
          "",

        publicSubheadline:
          "",

        publicAbout:
          "",

        primaryCtaText:
          "Get in touch",

        publicPublished:
          true,

        showProducts:
          true,

        showBusinessHours:
          true,

        showSocialLinks:
          true,

        showLocation:
          true,

        showPhone:
          true,

        showEmail:
          true,

        showWhatsapp:
          true,
      },
    });

  async function nextStep() {
    setServerError(null);

    const fields =
      stepFields[step];

    const valid =
      fields.length === 0
        ? true
        : await form.trigger(
            fields,
            {
              shouldFocus:
                true,
            },
          );

    if (!valid) {
      return;
    }

    setStep(
      (current) =>
        Math.min(
          current + 1,
          labels.length - 1,
        ),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function previousStep() {
    setServerError(null);

    setStep(
      (current) =>
        Math.max(
          current - 1,
          0,
        ),
    );

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  const onSubmit =
    form.handleSubmit(
      (values) => {
        setServerError(null);

        startTransition(
          () => {
            void completeOnboardingAction(
              values,
            )
              .then(
                (
                  result,
                ) => {
                  if (
                    !result.success
                  ) {
                    setServerError(
                      result.message,
                    );

                    return;
                  }

                  router.replace(
                    "/dashboard",
                  );

                  router.refresh();
                },
              )
              .catch(
                (
                  error,
                ) => {
                  console.error(
                    "LeadNexus onboarding submit error:",
                    error,
                  );

                  setServerError(
                    "Something went wrong while completing onboarding. Please try again.",
                  );
                },
              );
          },
        );
      },
    );

  const steps = [
    <OwnerStep
      key="owner"
    />,

    <BusinessStep
      key="business"
    />,

    <LocationStep
      key="location"
    />,

    <SocialStep
      key="social"
    />,

    <HoursStep
      key="hours"
    />,

    <ProductsStep
      key="products"
    />,

    <ContactTemplateStep
      key="contact"
    />,

    <PublicPageStep
      key="public"
    />,

    <ReviewStep
      key="review"
    />,
  ];

  return (
    <FormProvider
      {...form}
    >
      <form
        onSubmit={onSubmit}
        className="mx-auto w-full max-w-4xl space-y-8"
      >
        <OnboardingProgress
          step={step}
          labels={labels}
        />

        <Card className="border-border/60 shadow-xl shadow-black/5">
          <CardContent className="p-6 sm:p-8">
            {steps[step]}
          </CardContent>
        </Card>

        {serverError ? (
          <div
            className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
            aria-live="polite"
          >
            {serverError}
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            disabled={
              step === 0 ||
              pending
            }
            onClick={
              previousStep
            }
          >
            <ArrowLeft className="size-4" />
            Back
          </Button>

          {step <
          labels.length - 1 ? (
            <Button
              type="button"
              onClick={() => {
                void nextStep();
              }}
            >
              Continue
              <ArrowRight className="size-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={pending}
            >
              {pending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Creating workspace...
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Finish onboarding
                </>
              )}
            </Button>
          )}
        </div>
      </form>
    </FormProvider>
  );
}