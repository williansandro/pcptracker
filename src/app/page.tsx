
"use client";

import { MetricCard } from '@/components/dashboard/metric-card';
import { ProductionChart } from '@/components/dashboard/production-chart';
import { DemandFulfillmentCard } from '@/components/dashboard/demand-fulfillment-card';
import { useAppContext } from '@/contexts/app-context';
import { Package, Factory, CheckCircle2, Clock3, PieChartIcon, BarChartIcon, ListChecks, TimerIcon, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClientSideDateTime } from "@/components/client-side-date-time";
import { formatDuration, cn } from "@/lib/utils";
import { ptBR } from 'date-fns/locale';
import { PieChart, Pie, Cell, ResponsiveContainer as RechartsResponsiveContainer, Legend as RechartsLegend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import type { ProductionOrderStatus, ProductionOrder, SKU } from '@/types';

const STATUS_COLORS: Record<ProductionOrderStatus, string> = {
  Aberta: "hsl(var(--chart-3))",
  "Em Progresso": "hsl(var(--chart-4))",
  Concluída: "hsl(var(--chart-2))",
  Cancelada: "hsl(var(--chart-5))",
};

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

interface CompletedPoDetails extends ProductionOrder {
  skuCode: string;
  skuDescription: string;
  secondsPerUnit: string | number;
}

export default function DashboardPage() {
  const { skus, productionOrders, findSkuById } = useAppContext();

  const totalSKUs = useMemo(() => skus.length, [skus]);

  const openPOsCount = useMemo(() => productionOrders.filter(po => po.status === 'Aberta').length, [productionOrders]);
  const inProgressPOsCount = useMemo(() => productionOrders.filter(po => po.status === 'Em Progresso').length, [productionOrders]);
  const totalOpenOrInProgressPOs = openPOsCount + inProgressPOsCount;

  const completedPOsCount = useMemo(() => productionOrders.filter(po => po.status === 'Concluída').length, [productionOrders]);

  const avgProductionTimeOverall = useMemo(() => {
    const completedWithTime = productionOrders.filter(po => po.status === 'Concluída' && po.productionTime && po.productionTime > 0);
    if (completedWithTime.length === 0) return 'N/D';
    const totalTimeSeconds = completedWithTime.reduce((sum, po) => sum + (po.productionTime || 0), 0);
    const avgTimeSeconds = totalTimeSeconds / completedWithTime.length;
    return formatDuration(avgTimeSeconds);
  }, [productionOrders]);

  const productionOrderStatusData = useMemo(() => {
    const statusCounts = productionOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<ProductionOrderStatus, number>);

    return (Object.keys(statusCounts) as ProductionOrderStatus[]).map(status => ({
      name: status,
      value: statusCounts[status],
      fill: STATUS_COLORS[status] || "hsl(var(--muted))",
    })).filter(item => item.value > 0);
  }, [productionOrders]);

  const topSkusByProducedQuantityData = useMemo(() => {
    const skuProduction: Record<string, number> = {};
    productionOrders.forEach(po => {
      if (po.status === 'Concluída' && po.producedQuantity && po.producedQuantity > 0) {
        const sku = findSkuById(po.skuId);
        if (sku) {
          skuProduction[sku.code] = (skuProduction[sku.code] || 0) + po.producedQuantity;
        }
      }
    });

    return Object.entries(skuProduction)
      .map(([skuCode, totalProduced]) => ({ skuCode, totalProduced }))
      .sort((a, b) => b.totalProduced - a.totalProduced)
      .slice(0, 5)
      .map((item, index) => ({ ...item, fill: CHART_COLORS[index % CHART_COLORS.length] }));
  }, [productionOrders, findSkuById]);

  const completedPoDetails = useMemo(() => {
    return productionOrders
      .filter(po => po.status === 'Concluída')
      .map(po => {
        const sku = findSkuById(po.skuId);
        const secondsPerUnit = (po.productionTime && po.producedQuantity && po.producedQuantity > 0)
          ? (po.productionTime / po.producedQuantity).toFixed(2)
          : 'N/D';
        return {
          ...po,
          skuCode: sku?.code || 'N/D',
          skuDescription: sku?.description || 'SKU não encontrado',
          secondsPerUnit,
        };
      })
      .sort((a, b) => (b.endTime && a.endTime) ? new Date(b.endTime).getTime() - new Date(a.endTime).getTime() : 0);
  }, [productionOrders, findSkuById]);

  const avgProductionTimePerSkuData = useMemo(() => {
    const completedPOs = productionOrders.filter(
      (po) => po.status === 'Concluída' && po.productionTime && po.productionTime > 0
    );

    const skuProductionStats: Record<string, { totalTime: number; count: number }> = {};

    completedPOs.forEach((po) => {
      if (!skuProductionStats[po.skuId]) {
        skuProductionStats[po.skuId] = { totalTime: 0, count: 0 };
      }
      skuProductionStats[po.skuId].totalTime += po.productionTime!;
      skuProductionStats[po.skuId].count += 1;
    });

    const skusWithAvgTime = Object.entries(skuProductionStats)
      .map(([skuId, stats]) => {
        const sku = findSkuById(skuId);
        return {
          skuId,
          skuCode: sku ? sku.code : 'Desconhecido',
          avgTimeSeconds: stats.count > 0 ? stats.totalTime / stats.count : 0,
          poCount: stats.count,
        };
      })
      .filter(item => item.avgTimeSeconds > 0)
      .sort((a, b) => b.poCount - a.poCount) // Prioritize by PO count to show most frequent
      .slice(0, 5); // Take top 5 by PO count

    return skusWithAvgTime.map((item, index) => ({
      skuCode: item.skuCode,
      avgTimeFormatted: formatDuration(item.avgTimeSeconds),
      avgTimeSeconds: item.avgTimeSeconds,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [productionOrders, findSkuById]);

  const metaVsRealizadoOPData = useMemo(() => {
    const relevantPOs = productionOrders
      .filter(po => po.status === 'Concluída' || po.status === 'Em Progresso')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) 
      .slice(0, 7); 

    return relevantPOs.map(po => {
      const sku = findSkuById(po.skuId);
      return {
        name: `OP ${po.id.substring(0, 4)} - ${sku?.code || 'N/D'}`,
        meta: po.targetQuantity,
        realizado: po.producedQuantity || 0, 
      };
    }).reverse(); 
  }, [productionOrders, findSkuById]);


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total de SKUs" value={totalSKUs} icon={Package} description="Número de SKUs cadastrados" className="metric-card-purple" />
        <MetricCard title="Ordens Abertas/Em Progresso" value={totalOpenOrInProgressPOs} icon={Factory} description="Ordens pendentes ou em execução" className="metric-card-blue"/>
        <MetricCard title="Ordens Concluídas" value={completedPOsCount} icon={CheckCircle2} description="Ordens de produção finalizadas" className="metric-card-orange"/>
        <MetricCard title="Tempo Médio de Produção (Geral)" value={avgProductionTimeOverall} icon={Clock3} description="Tempo médio por ordem concluída" className="metric-card-teal"/>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ProductionChart />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DemandFulfillmentCard />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Meta vs. Realizado por OP
            </CardTitle>
            <CardDescription>Comparativo de Quantidade Alvo e Produzida para OPs recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {metaVsRealizadoOPData.length > 0 ? (
              <ChartContainer config={{}} className="aspect-video max-h-[300px]">
                <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={metaVsRealizadoOPData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={10} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                    <RechartsTooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                      formatter={(value: number, name: string) => [value.toLocaleString('pt-BR') + ' un.', name.charAt(0).toUpperCase() + name.slice(1)]}
                    />
                    <RechartsLegend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="meta" name="Meta" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </RechartsResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma OP "Em Progresso" ou "Concluída" para exibir.</p>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Distribuição de Status das OPs
            </CardTitle>
            <CardDescription>Visão geral dos status das ordens de produção.</CardDescription>
          </CardHeader>
          <CardContent>
            {productionOrderStatusData.length > 0 ? (
              <ChartContainer config={{}} className="mx-auto aspect-square max-h-[300px]">
                <RechartsResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <RechartsTooltip
                      cursor={{ fill: "hsl(var(--muted))" }}
                      content={<ChartTooltipContent hideLabel />}
                    />
                    <Pie
                      data={productionOrderStatusData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      labelLine={false}
                      label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                        const RADIAN = Math.PI / 180;
                        const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                        return (percent * 100) > 5 ? (
                          <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                    >
                      {productionOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                    <RechartsLegend />
                  </PieChart>
                </RechartsResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma ordem de produção para exibir status.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5 text-primary" />
              Top 5 SKUs por Qtd. Produzida
            </CardTitle>
            <CardDescription>SKUs com maior volume de produção (OPs concluídas).</CardDescription>
          </CardHeader>
          <CardContent>
            {topSkusByProducedQuantityData.length > 0 ? (
              <ChartContainer config={{}} className="aspect-video max-h-[300px]">
                 <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={topSkusByProducedQuantityData} layout="vertical" margin={{ right: 20, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="skuCode" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} interval={0} />
                    <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [value.toLocaleString('pt-BR') + ' un.', 'Produzido']}
                    />
                    <Bar dataKey="totalProduced" radius={[0, 4, 4, 0]}>
                       {topSkusByProducedQuantityData.map((entry) => (
                        <Cell key={`cell-${entry.skuCode}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </RechartsResponsiveContainer>
              </ChartContainer>
            ) : (
               <p className="text-center text-muted-foreground py-10">Nenhuma produção concluída para exibir.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TimerIcon className="h-5 w-5 text-primary" />
              Tempo Médio de Produção por SKU
            </CardTitle>
            <CardDescription>Top 5 SKUs com mais OPs concluídas e seus tempos médios.</CardDescription>
          </CardHeader>
          <CardContent>
            {avgProductionTimePerSkuData.length > 0 ? (
               <ChartContainer config={{}} className="aspect-video max-h-[300px]">
                <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgProductionTimePerSkuData} layout="vertical" margin={{ right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis
                      type="number"
                      dataKey="avgTimeSeconds"
                      stroke="hsl(var(--foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => formatDuration(value)}
                    />
                    <YAxis
                      dataKey="skuCode"
                      type="category"
                      stroke="hsl(var(--foreground))"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      width={80}
                      interval={0}
                    />
                    <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number, name: string, props: any) => {
                           if (name === "avgTimeSeconds") return [props.payload.avgTimeFormatted, "Tempo Médio"];
                           return [value, name];
                        }}
                    />
                    <Bar dataKey="avgTimeSeconds" name="Tempo Médio" radius={[0, 4, 4, 0]}>
                      {avgProductionTimePerSkuData.map((entry) => (
                        <Cell key={`cell-${entry.skuCode}`} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </RechartsResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Dados insuficientes para exibir tempo médio por SKU.</p>
            )}
          </CardContent>
        </Card>

      </div>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5 text-primary" />
            Detalhes de Ordens Concluídas
          </CardTitle>
          <CardDescription>Lista de OPs finalizadas com tempos e eficiência unitária.</CardDescription>
        </CardHeader>
        <CardContent>
          {completedPoDetails.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-center">Início</TableHead>
                    <TableHead className="text-center">Fim</TableHead>
                    <TableHead className="text-center">Tempo Total</TableHead>
                    <TableHead className="text-right">Qtd. Prod.</TableHead>
                    <TableHead className="text-right">Seg/Unid.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPoDetails.map((po, index) => (
                    <TableRow
                      key={po.id}
                      className={cn(
                        index % 2 !== 0 ? "bg-[#EBEBEB]" : ""
                      )}
                    >
                      <TableCell>
                        <div className="font-medium">{po.skuCode}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{po.skuDescription}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <ClientSideDateTime dateString={po.startTime} outputFormat="dd/MM HH:mm" locale={ptBR} placeholder="-" />
                      </TableCell>
                      <TableCell className="text-center">
                        <ClientSideDateTime dateString={po.endTime} outputFormat="dd/MM HH:mm" locale={ptBR} placeholder="-" />
                      </TableCell>
                      <TableCell className="text-center">{formatDuration(po.productionTime)}</TableCell>
                      <TableCell className="text-right">{po.producedQuantity?.toLocaleString('pt-BR') || '-'}</TableCell>
                      <TableCell className="text-right">{po.secondsPerUnit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Nenhuma ordem de produção concluída para exibir.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
