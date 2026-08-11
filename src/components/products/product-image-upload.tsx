"use client";

import {
  useRef,
  useState,
} from "react";

import {
  ImagePlus,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";

import {
  useRouter,
} from "next/navigation";

import {
  finalizeProductImageAction,
  removeProductImageAction,
} from "@/actions/products/update-product";

import {
  Button,
} from "@/components/ui/button";

import {
  createClient,
} from "@/lib/supabase/client";

const allowedTypes =
  new Set([
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/avif",
  ]);

const maxSize =
  8 *
  1024 *
  1024;

type ProductImageUploadProps = {
  businessId: string;
  productId: string;
  currentUrl: string | null;
};

export function ProductImageUpload({
  businessId,
  productId,
  currentUrl,
}: ProductImageUploadProps) {
  const router =
    useRouter();

  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState<string | null>(
      null,
    );

  async function upload(
    file: File,
  ) {
    setError(null);

    if (
      !allowedTypes.has(
        file.type,
      )
    ) {
      setError(
        "Use JPG, PNG, WebP or AVIF.",
      );

      return;
    }

    if (
      file.size >
      maxSize
    ) {
      setError(
        "Image must be 8 MB or smaller.",
      );

      return;
    }

    setLoading(true);

    try {
      const supabase =
        createClient();

      const path =
        `${businessId}/products/${productId}`;

      const {
        error:
          uploadError,
      } =
        await supabase.storage
          .from(
            "business-media",
          )
          .upload(
            path,
            file,
            {
              upsert:
                true,

              contentType:
                file.type,

              cacheControl:
                "3600",
            },
          );

      if (uploadError) {
        throw uploadError;
      }

      await finalizeProductImageAction(
        productId,
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof
          Error
          ? caught.message
          : "Unable to upload product image.",
      );
    } finally {
      setLoading(false);

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    }
  }

  async function remove() {
    setError(null);
    setLoading(true);

    try {
      await removeProductImageAction(
        productId,
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof
          Error
          ? caught.message
          : "Unable to remove product image.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <div
        className="flex h-44 w-full items-center justify-center overflow-hidden rounded-xl border bg-muted/30"
        style={
          currentUrl
            ? {
                backgroundImage:
                  `url("${currentUrl}")`,

                backgroundPosition:
                  "center",

                backgroundSize:
                  "cover",
              }
            : undefined
        }
      >
        {!currentUrl ? (
          <ImagePlus className="size-8 text-muted-foreground" />
        ) : null}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(
          event,
        ) => {
          const file =
            event.target
              .files?.[0];

          if (file) {
            void upload(file);
          }
        }}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading}
          onClick={() =>
            inputRef.current
              ?.click()
          }
        >
          {loading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}

          {currentUrl
            ? "Replace image"
            : "Add image"}
        </Button>

        {currentUrl ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={loading}
            onClick={() => {
              void remove();
            }}
          >
            <Trash2 className="size-4" />
            Remove
          </Button>
        ) : null}
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}