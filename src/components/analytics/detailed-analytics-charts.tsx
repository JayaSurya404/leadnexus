"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type {
  AnalyticsDay,
  AnalyticsSource,
} from "@/types/detailed-analytics";

type DetailedAnalyticsChartsProps = {
  trend:
    AnalyticsDay[];

  sources:
    AnalyticsSource[];
};

export function DetailedAnalyticsCharts({
  trend,
  sources,
}: DetailedAnalyticsChartsProps) {
  return (
    <div className="grid gap-5 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>
            Visitor trend
          </CardTitle>

          <CardDescription>
            Visitors and owner-visible
            leads over the last
            14 days.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="h-72">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <LineChart
                data={
                  trend
                }
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={
                    false
                  }
                />

                <XAxis
                  dataKey="label"
                  fontSize={12}
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                />

                <YAxis
                  allowDecimals={
                    false
                  }
                  fontSize={12}
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                />

                <Tooltip />

                <Line
                  type="monotone"
                  dataKey="visitors"
                  name="Visitors"
                  stroke="var(--primary)"
                  strokeWidth={2}
                  dot={false}
                />

                <Line
                  type="monotone"
                  dataKey="leads"
                  name="Visible leads"
                  stroke="var(--muted-foreground)"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Traffic sources
          </CardTitle>

          <CardDescription>
            Top first-touch sources
            during the last 30 days.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {sources.length ===
          0 ? (
            <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
              No source data yet.
            </div>
          ) : (
            <div className="h-72">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={
                    sources
                  }
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={
                      false
                    }
                  />

                  <XAxis
                    dataKey="source"
                    fontSize={12}
                    tickLine={
                      false
                    }
                    axisLine={
                      false
                    }
                  />

                  <YAxis
                    allowDecimals={
                      false
                    }
                    fontSize={12}
                    tickLine={
                      false
                    }
                    axisLine={
                      false
                    }
                  />

                  <Tooltip />

                  <Bar
                    dataKey="visitors"
                    name="Visitors"
                    fill="var(--primary)"
                    radius={[
                      6,
                      6,
                      0,
                      0,
                    ]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}