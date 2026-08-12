"use client";

import {
  useState,
} from "react";

import {
  Check,
  Copy,
  QrCode,
} from "lucide-react";

import {
  QRCodeSVG,
} from "qrcode.react";

import {
  Button,
} from "@/components/ui/button";

type TrackingLinkToolsProps = {
  url: string;
};

export function TrackingLinkTools({
  url,
}: TrackingLinkToolsProps) {
  const [
    copied,
    setCopied,
  ] =
    useState(false);

  const [
    showQr,
    setShowQr,
  ] =
    useState(false);

  async function copy() {
    await navigator.clipboard
      .writeText(
        url,
      );

    setCopied(true);

    window.setTimeout(
      () => {
        setCopied(false);
      },
      1500,
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            void copy();
          }}
        >
          {copied ? (
            <Check className="size-4" />
          ) : (
            <Copy className="size-4" />
          )}

          {copied
            ? "Copied"
            : "Copy link"}
        </Button>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => {
            setShowQr(
              (value) =>
                !value,
            );
          }}
        >
          <QrCode className="size-4" />

          {showQr
            ? "Hide QR"
            : "Show QR"}
        </Button>
      </div>

      {showQr ? (
        <div className="inline-flex rounded-xl border bg-white p-4">
          <QRCodeSVG
            value={url}
            size={160}
            level="M"
          />
        </div>
      ) : null}
    </div>
  );
}