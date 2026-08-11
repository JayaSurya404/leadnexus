"use client";

import {
  Check,
} from "lucide-react";

import {
  Progress,
} from "@/components/ui/progress";

type OnboardingProgressProps = {
  step: number;
  labels: readonly string[];
};

export function OnboardingProgress({
  step,
  labels,
}: OnboardingProgressProps) {
  const progress =
    ((step + 1) /
      labels.length) *
    100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium">
            Step {step + 1} of{" "}
            {labels.length}
          </p>

          <p className="text-sm text-muted-foreground">
            {labels[step]}
          </p>
        </div>

        <span className="text-sm font-medium text-muted-foreground">
          {Math.round(
            progress,
          )}
          %
        </span>
      </div>

      <Progress
        value={progress}
        className="h-2"
      />

      <div className="hidden grid-cols-9 gap-2 lg:grid">
        {labels.map(
          (label, index) => (
            <div
              key={label}
              className="space-y-2"
            >
              <div
                className={[
                  "flex size-7 items-center justify-center rounded-full border text-xs font-semibold",
                  index < step
                    ? "border-primary bg-primary text-primary-foreground"
                    : index ===
                        step
                      ? "border-primary text-primary"
                      : "border-border text-muted-foreground",
                ].join(" ")}
              >
                {index < step ? (
                  <Check className="size-3.5" />
                ) : (
                  index + 1
                )}
              </div>

              <p className="truncate text-xs text-muted-foreground">
                {label}
              </p>
            </div>
          ),
        )}
      </div>
    </div>
  );
}