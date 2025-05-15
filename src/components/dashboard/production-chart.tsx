"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"

const chartData = [
  { month: "Jan", produced: 186, target: 200 },
  { month: "Fev", produced: 250, target: 280 },
  { month: "Mar", produced: 205, target: 220 },
  { month: "Abr", produced: 278, target: 300 },
  { month: "Mai", produced: 189, target: 210 },
  { month: "Jun", produced: 239, target: 250 },
  { month: "Jul", produced: 349, target: 350 },
]

const chartConfig = {
  produced: {
    label: "Produzido",
    color: "hsl(var(--primary))",
  },
  target: {
    label: "Meta",
    color: "hsl(var(--secondary-foreground))",
  },
} satisfies ChartConfig

export function ProductionChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral da Produção</CardTitle>
        <CardDescription>Produção Mensal vs. Meta (Dados Fictícios)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData}>
            <XAxis
              dataKey="month"
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="hsl(var(--foreground))"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value} un.`}
            />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted))' }}
              contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
            />
            <Legend />
            <Bar dataKey="produced" fill="var(--color-produced)" radius={[4, 4, 0, 0]} name={chartConfig.produced.label}/>
            <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} name={chartConfig.target.label}/>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
