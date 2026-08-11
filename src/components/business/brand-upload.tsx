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
  finalizeBrandUploadAction,
  removeBrandImageAction,
} from "@/actions/business/update-brand";

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

type BrandUploadProps = {
  businessId: string;

  kind:
    | "logo"
    | "cover";

  currentUrl:
    | string
    | null;
};

export function BrandUpload({
  businessId,
  kind,
  currentUrl,
}: BrandUploadProps) {
  const router =
    useRouter();

  const inputRef =
    useRef<HTMLInputElement>(
      null,
    );

  const [
    uploading,
    setUploading,
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

    setUploading(true);

    try {
      const supabase =
        createClient();

      const path =
        `${businessId}/${kind}/current`;

      const { error:
        uploadError } =
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

      await finalizeBrandUploadAction(
        kind,
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof
          Error
          ? caught.message
          : "Unable to upload image.",
      );
    } finally {
      setUploading(false);

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

    setUploading(true);

    try {
      await removeBrandImageAction(
        kind,
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof
          Error
          ? caught.message
          : "Unable to remove image.",
      );
    } finally {
      setUploading(false);
    }
  }

  const title =
    kind === "logo"
      ? "Business logo"
      : "Cover image";

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">
          {title}
        </p>

        <p className="text-xs text-muted-foreground">
          JPG, PNG, WebP or AVIF ·
          maximum 8 MB
        </p>
      </div>

      <div
        className={[
          "flex items-center justify-center overflow-hidden border bg-muted/30",
          kind === "logo"
            ? "size-32 rounded-2xl"
            : "h-44 w-full rounded-xl",
        ].join(" ")}
        style={
          currentUrl
            ? {
                backgroundImage:
                  `url("${currentUrl}")`,

                backgroundSize:
                  "cover",

                backgroundPosition:
                  "center",
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
          disabled={
            uploading
          }
          onClick={() =>
            inputRef.current
              ?.click()
          }
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}

          {currentUrl
            ? "Replace"
            : "Upload"}
        </Button>

        {currentUrl ? (
          <Button
            type="button"
            variant="outline"
            disabled={
              uploading
            }
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