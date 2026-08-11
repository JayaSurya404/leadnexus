"use client";

import {
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
  VisitorTrendPoint,
} from "@/types/analytics";

type VisitorChartProps = {
  data:
    VisitorTrendPoint[];
};

export function VisitorChart({
  data,
}: VisitorChartProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>
          Visitor activity
        </CardTitle>

        <CardDescription>
          Visitor sessions from the last
          14 days.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <div className="h-[280px] w-full">
          <ResponsiveContainer
            width="100%"
            height="100%"
          >
            <LineChart
              data={data}
              margin={{
                top: 8,
                right: 8,
                left: -18,
                bottom: 0,
              }}
            >
              <CartesianGrid
                vertical={
                  false
                }
                strokeDasharray="3 3"
                opacity={0.25}
              />

              <XAxis
                dataKey="label"
                tickLine={
                  false
                }
                axisLine={
                  false
                }
                fontSize={12}
              />

              <YAxis
                allowDecimals={
                  false
                }
                tickLine={
                  false
                }
                axisLine={
                  false
                }
                fontSize={12}
              />

              <Tooltip />

              <Line
                type="monotone"
                dataKey="visitors"
                name="Visitors"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={false}
                activeDot={{
                  r: 5,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}