"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { week: string; count: number };

export function WeeklyChart({ data }: { data: Point[] }) {
  return (
    <div className="text-muted h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid vertical={false} stroke="var(--border)" />
          <XAxis
            dataKey="week"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "currentColor", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "var(--accent-soft)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const point = payload[0].payload as Point;
              return (
                <div className="border-border bg-surface text-foreground rounded-md border px-2.5 py-1.5 text-xs shadow-sm">
                  <div className="text-muted">Week of {point.week}</div>
                  <div className="font-medium">
                    {point.count} {point.count === 1 ? "application" : "applications"}
                  </div>
                </div>
              );
            }}
          />
          <Bar dataKey="count" className="fill-accent" radius={[4, 4, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
