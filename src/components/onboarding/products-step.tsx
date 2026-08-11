"use client";

import {
  Plus,
  Trash2,
} from "lucide-react";

import {
  useFieldArray,
  useFormContext,
} from "react-hook-form";

import type {
  OnboardingInput,
} from "@/lib/validation/onboarding";

import {
  Button,
} from "@/components/ui/button";

import {
  Input,
} from "@/components/ui/input";

import {
  Label,
} from "@/components/ui/label";

import {
  Textarea,
} from "@/components/ui/textarea";

export function ProductsStep() {
  const {
    control,
    register,
    formState: {
      errors,
    },
  } =
    useFormContext<OnboardingInput>();

  const {
    fields,
    append,
    remove,
  } = useFieldArray({
    control,
    name: "products",
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">
          Products & services
        </h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Add what visitors can discover
          on your LeadNexus page.
        </p>
      </div>

      <div className="space-y-5">
        {fields.map(
          (field, index) => (
            <div
              key={field.id}
              className="rounded-xl border p-5"
            >
              <div className="mb-5 flex items-center justify-between">
                <p className="font-medium">
                  Item {index + 1}
                </p>

                {fields.length >
                1 ? (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() =>
                      remove(index)
                    }
                    aria-label="Remove item"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                ) : null}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    Type
                  </Label>

                  <select
                    {...register(
                      `products.${index}.itemType`,
                    )}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  >
                    <option value="PRODUCT">
                      Product
                    </option>

                    <option value="SERVICE">
                      Service
                    </option>
                  </select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Name
                  </Label>

                  <Input
                    placeholder="Example: 5KW Solar Installation"
                    {...register(
                      `products.${index}.name`,
                    )}
                  />

                  {errors
                    .products?.[
                    index
                  ]?.name
                    ?.message ? (
                    <p className="text-sm text-destructive">
                      {
                        errors
                          .products[
                          index
                        ]?.name
                          ?.message
                      }
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Description
                  </Label>

                  <Textarea
                    rows={4}
                    {...register(
                      `products.${index}.description`,
                    )}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label>
                    Price text
                  </Label>

                  <Input
                    placeholder="Example: Starting from ₹25,000"
                    {...register(
                      `products.${index}.priceText`,
                    )}
                  />
                </div>
              </div>
            </div>
          ),
        )}
      </div>

      {fields.length < 10 ? (
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            append({
              itemType:
                "PRODUCT",

              name: "",

              description:
                "",

              priceText:
                "",
            })
          }
        >
          <Plus className="size-4" />
          Add another
        </Button>
      ) : null}
    </div>
  );
}