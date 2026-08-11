"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
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
  SourcePerformancePoint,
} from "@/types/analytics";

type SourceChartProps = {
  data:
    SourcePerformancePoint[];
};

export function SourceChart({
  data,
}: SourceChartProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>
          Traffic sources
        </CardTitle>

        <CardDescription>
          Top recent sources bringing
          visitors to your LeadNexus
          page.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-[280px] items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Traffic source data will
            appear after visitors start
            arriving.
          </div>
        ) : (
          <div className="h-[280px] w-full">
            <ResponsiveContainer
              width="100%"
              height="100%"
            >
              <BarChart
                data={data}
                layout="vertical"
                margin={{
                  top: 5,
                  right: 10,
                  left: 10,
                  bottom: 5,
                }}
              >
                <CartesianGrid
                  horizontal={
                    false
                  }
                  strokeDasharray="3 3"
                  opacity={0.25}
                />

                <XAxis
                  type="number"
                  allowDecimals={
                    false
                  }
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                />

                <YAxis
                  type="category"
                  dataKey="source"
                  width={85}
                  tickLine={
                    false
                  }
                  axisLine={
                    false
                  }
                  fontSize={12}
                />

                <Tooltip />

                <Bar
                  dataKey="visitors"
                  name="Visitors"
                  fill="var(--primary)"
                  radius={[
                    0,
                    5,
                    5,
                    0,
                  ]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}