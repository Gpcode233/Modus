"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

type AccountsFlowChartProps = {
  series: number[]
  dates: string[]
  color: "green" | "red"
}

export function AccountsFlowChart({ series, dates, color }: AccountsFlowChartProps) {
  const data = dates.map((date, index) => ({
    date: new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    amount: series[index] ?? 0,
  }))

  const strokeColor = color === "green" ? "#16a34a" : "#dc2626"
  const fillColor = color === "green" ? "rgba(16, 185, 129, 0.12)" : "rgba(220, 38, 38, 0.12)"

  return (
    <ChartContainer className="mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid vertical={false} stroke="#e5e7eb" strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#9ca3af", fontSize: 10 }}
            minTickGap={12}
          />
          <YAxis hide domain={[0, "dataMax"]} />
          <Tooltip content={<ChartTooltipContent />} />
          <Line
            type="monotone"
            dataKey="amount"
            stroke={strokeColor}
            strokeWidth={2}
            dot={false}
            fill={fillColor}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}
