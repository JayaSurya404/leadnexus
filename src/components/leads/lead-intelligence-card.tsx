import {
  BrainCircuit,
  Flame,
  Lightbulb,
  Snowflake,
  Thermometer,
} from "lucide-react";

import {
  Badge,
} from "@/components/ui/badge";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  LeadIntelligenceView,
} from "@/types/leads";

type LeadIntelligenceCardProps = {
  intelligence:
    LeadIntelligenceView | null;
};

function temperatureIcon(
  temperature:
    LeadIntelligenceView["temperature"],
) {
  if (
    temperature ===
    "HOT"
  ) {
    return (
      <Flame className="size-4" />
    );
  }

  if (
    temperature ===
    "WARM"
  ) {
    return (
      <Thermometer className="size-4" />
    );
  }

  if (
    temperature ===
    "COLD"
  ) {
    return (
      <Snowflake className="size-4" />
    );
  }

  return (
    <BrainCircuit className="size-4" />
  );
}

export function LeadIntelligenceCard({
  intelligence,
}: LeadIntelligenceCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="size-5" />
          Lead intelligence
        </CardTitle>

        <CardDescription>
          LeadNexus behaviour and
          intent analysis.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {!intelligence ? (
          <div className="rounded-xl border border-dashed p-8 text-center">
            <BrainCircuit className="mx-auto size-8 text-muted-foreground" />

            <p className="mt-3 font-medium">
              Not analysed yet
            </p>

            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Intelligence will appear
              after the analysis phase
              processes this lead&apos;s
              behaviour.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <Badge className="gap-1.5">
                {temperatureIcon(
                  intelligence.temperature,
                )}

                {intelligence.temperature ===
                "HOT"
                  ? "Hot Lead"
                  : intelligence.temperature}
              </Badge>

              {intelligence.score !==
              null ? (
                <Badge variant="outline">
                  Score{" "}
                  {
                    intelligence.score
                  }
                </Badge>
              ) : null}
            </div>

            {intelligence.primaryInterest ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Primary interest
                </p>

                <p className="mt-2 font-medium">
                  {
                    intelligence.primaryInterest
                  }
                </p>
              </div>
            ) : null}

            {intelligence.reasons.length >
            0 ? (
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Why
                </p>

                <ul className="mt-3 space-y-2">
                  {intelligence.reasons.map(
                    (
                      reason,
                      index,
                    ) => (
                      <li
                        key={`${reason}-${index}`}
                        className="flex gap-2 text-sm leading-6 text-muted-foreground"
                      >
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />

                        {reason}
                      </li>
                    ),
                  )}
                </ul>
              </div>
            ) : null}

            {intelligence.recommendedAction ? (
              <div className="rounded-xl bg-muted/50 p-4">
                <div className="flex gap-3">
                  <Lightbulb className="mt-0.5 size-4 shrink-0" />

                  <div>
                    <p className="text-sm font-medium">
                      Recommended action
                    </p>

                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                      {
                        intelligence.recommendedAction
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
