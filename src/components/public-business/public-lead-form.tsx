"use client";

import type {
  FormEvent,
} from "react";

import {
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  Loader2,
  Send,
} from "lucide-react";

import {
  submitPublicLead,
  trackPublicActivity,
} from "@/features/tracking/browser";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import type {
  PublicProduct,
} from "@/types/public-business";

type PublicLeadFormProps = {
  businessId: string;

  sessionId:
    | string
    | null;

  products:
    PublicProduct[];

  selectedProductId:
    | string
    | null;

  onProductChange: (
    value:
      | string
      | null,
  ) => void;

  onCaptured: ({
    leadId,
    productId,
  }: {
    leadId: string;

    productId:
      | string
      | null;
  }) => void;
};

export function PublicLeadForm({
  businessId,
  sessionId,
  products,
  selectedProductId,
  onProductChange,
  onCaptured,
}: PublicLeadFormProps) {
  const [
    name,
    setName,
  ] =
    useState("");

  const [
    phone,
    setPhone,
  ] =
    useState("");

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    submitting,
    setSubmitting,
  ] =
    useState(false);

  const [
    completed,
    setCompleted,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  const started =
    useRef(false);

  function markStarted() {
    if (
      started.current ||
      !sessionId
    ) {
      return;
    }

    started.current =
      true;

    void trackPublicActivity({
      businessId,
      sessionId,

      eventType:
        "LEAD_FORM_STARTED",

      pagePath:
        window.location.pathname,
    }).catch(
      () => undefined,
    );
  }

  async function submit(
    event:
      FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    if (!sessionId) {
      setError(
        "The page is still preparing. Please try again.",
      );

      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const result =
        await submitPublicLead(
          {
            businessId,
            sessionId,

            productId:
              selectedProductId,

            name,
            phone,
            email,
          },
        );

      setCompleted(true);

      onCaptured({
        leadId:
          result.leadId,

        productId:
          selectedProductId,
      });
    } catch (caught) {
      setError(
        caught instanceof
          Error
          ? caught.message
          : "Unable to save your details.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (completed) {
    return (
      <div className="rounded-2xl border bg-background p-6 shadow-sm">
        <div className="flex size-11 items-center justify-center rounded-full bg-emerald-500/10">
          <CheckCircle2 className="size-5 text-emerald-600" />
        </div>

        <h3 className="mt-4 text-lg font-semibold">
          Details saved
        </h3>

        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Choose one of the contact
          options below to continue your
          enquiry with the business.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      onFocus={markStarted}
      className="space-y-5 rounded-2xl border bg-background p-6 shadow-sm"
    >
      <div>
        <h2 className="text-xl font-semibold">
          Interested?
        </h2>

        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          Share your contact details so
          the business can identify your
          enquiry.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-name">
          Name
        </Label>

        <Input
          id="lead-name"
          value={name}
          onChange={(
            event,
          ) =>
            setName(
              event.target.value,
            )
          }
          autoComplete="name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-phone">
          Phone
        </Label>

        <Input
          id="lead-phone"
          type="tel"
          value={phone}
          onChange={(
            event,
          ) =>
            setPhone(
              event.target.value,
            )
          }
          autoComplete="tel"
          placeholder="+91..."
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="lead-email">
          Email
        </Label>

        <Input
          id="lead-email"
          type="email"
          value={email}
          onChange={(
            event,
          ) =>
            setEmail(
              event.target.value,
            )
          }
          autoComplete="email"
          placeholder="Optional"
        />
      </div>

      {products.length >
      0 ? (
        <div className="space-y-2">
          <Label htmlFor="lead-product">
            Interested in
          </Label>

          <select
            id="lead-product"
            value={
              selectedProductId ??
              ""
            }
            onChange={(
              event,
            ) => {
              onProductChange(
                event.target
                  .value ||
                  null,
              );
            }}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
          >
            <option value="">
              General enquiry
            </option>

            {products.map(
              (product) => (
                <option
                  key={
                    product.id
                  }
                  value={
                    product.id
                  }
                >
                  {
                    product.name
                  }
                </option>
              ),
            )}
          </select>
        </div>
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        type="submit"
        className="w-full"
        disabled={
          submitting ||
          !sessionId
        }
      >
        {submitting ? (
          <>
            <Loader2 className="size-4 animate-spin" />
            Saving...
          </>
        ) : (
          <>
            <Send className="size-4" />
            Continue
          </>
        )}
      </Button>

      <p className="text-xs leading-5 text-muted-foreground">
        LeadNexus records your enquiry
        details and interaction with this
        business page.
      </p>
    </form>
  );
}