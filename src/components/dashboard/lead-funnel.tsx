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
  LeadFunnelPoint,
} from "@/types/analytics";

type LeadFunnelProps = {
  data:
    LeadFunnelPoint[];
};

export function LeadFunnel({
  data,
}: LeadFunnelProps) {
  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle>
          Lead funnel
        </CardTitle>

        <CardDescription>
          Current owner-visible lead
          stages.
        </CardDescription>
      </CardHeader>

      <CardContent>
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
                left: 5,
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
                dataKey="label"
                width={80}
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
                dataKey="value"
                name="Leads"
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
      </CardContent>
    </Card>
  );
}