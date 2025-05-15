"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ChartConfig } from "@/components/ui/chart"
import { useAppContext } from "@/contexts/app-context"
import { useMemo } from "react"
import { format, parseISO, startOfMonth, addMonths, subMonths } from "date-fns"
import { ptBR } from "date-fns/locale"

const defaultChartConfig = {
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
  const { demands, productionOrders } = useAppContext();

  const chartData = useMemo(() => {
    const today = new Date();
    const lastSixMonths = Array.from({ length: 6 }).map((_, i) => {
      return startOfMonth(subMonths(today, 5 - i)); // Corrected: Go from 5 months ago to current month
    });

    return lastSixMonths.map(monthDate => {
      const monthYearStr = format(monthDate, 'yyyy-MM');
      
      const monthlyDemands = demands.filter(d => d.monthYear === monthYearStr);
      const target = monthlyDemands.reduce((sum, d) => sum + d.targetQuantity, 0);
      
      const monthlyProduction = productionOrders
        .filter(po => po.status === 'Concluída' && po.endTime?.startsWith(monthYearStr))
        .reduce((sum, po) => sum + po.quantity, 0);
        
      return {
        month: format(monthDate, "MMM", { locale: ptBR }),
        produced: monthlyProduction,
        target: target,
      };
    });
  }, [demands, productionOrders]);


  return (
    <Card>
      <CardHeader>
        <CardTitle>Visão Geral da Produção</CardTitle>
        <CardDescription>Produção Mensal vs. Meta (Últimos 6 Meses)</CardDescription>
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
              formatter={(value: number, name: string) => [value.toLocaleString('pt-BR'), defaultChartConfig[name as keyof typeof defaultChartConfig]?.label || name]}
            />
            <Legend formatter={(value) => defaultChartConfig[value as keyof typeof defaultChartConfig]?.label || value} />
            <Bar dataKey="produced" fill="var(--color-produced)" radius={[4, 4, 0, 0]} name={defaultChartConfig.produced.label}/>
            <Bar dataKey="target" fill="var(--color-target)" radius={[4, 4, 0, 0]} name={defaultChartConfig.target.label}/>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
