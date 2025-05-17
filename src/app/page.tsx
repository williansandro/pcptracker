
"use client";

import { MetricCard } from '@/components/dashboard/metric-card';
import { ProductionChart } from '@/components/dashboard/production-chart';
import { DemandFulfillmentCard } from '@/components/dashboard/demand-fulfillment-card';
import { useAppContext } from '@/contexts/app-context';
import { Package, Factory, CheckCircle2, Clock3, PieChartIcon, BarChartIcon, ListChecks, TimerIcon, TrendingUp, FilterX, LayersIcon, Filter } from 'lucide-react';
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const STATUS_COLORS: Record<ProductionOrderStatus, string> = {
  Aberta: "hsl(var(--chart-3))", // Orange
  "Em Progresso": "hsl(var(--chart-4))", // Green
  Concluída: "hsl(var(--chart-2))", // Purple
  Cancelada: "hsl(var(--chart-5))", // Pink/Magenta
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
  const { skus, productionOrders: allProductionOrders, demands: allDemands, findSkuById } = useAppContext();
  const [selectedSkuFilter, setSelectedSkuFilter] = useState<SKU | null>(null);

  const sortedSkus = useMemo(() => [...skus].sort((a, b) => a.code.localeCompare(b.code)), [skus]);

  const filteredProductionOrders = useMemo(() => {
    if (!selectedSkuFilter) return allProductionOrders;
    return allProductionOrders.filter(po => po.skuId === selectedSkuFilter.id);
  }, [allProductionOrders, selectedSkuFilter]);

  const filteredDemands = useMemo(() => {
    if (!selectedSkuFilter) return allDemands;
    return allDemands.filter(d => d.skuId === selectedSkuFilter.id);
  }, [allDemands, selectedSkuFilter]);

  const totalSKUs = useMemo(() => skus.length, [skus]);

  const openPOsCount = useMemo(() => filteredProductionOrders.filter(po => po.status === 'Aberta').length, [filteredProductionOrders]);
  const inProgressPOsCount = useMemo(() => filteredProductionOrders.filter(po => po.status === 'Em Progresso').length, [filteredProductionOrders]);
  const totalOpenOrInProgressPOs = openPOsCount + inProgressPOsCount;

  const completedPOsCount = useMemo(() => filteredProductionOrders.filter(po => po.status === 'Concluída').length, [filteredProductionOrders]);

  const avgProductionTimeOverall = useMemo(() => {
    const completedWithTime = filteredProductionOrders.filter(po => po.status === 'Concluída' && po.productionTime && po.productionTime > 0);
    if (completedWithTime.length === 0) return 'N/D';
    const totalTimeSeconds = completedWithTime.reduce((sum, po) => sum + (po.productionTime || 0), 0);
    const avgTimeSeconds = totalTimeSeconds / completedWithTime.length;
    return formatDuration(avgTimeSeconds);
  }, [filteredProductionOrders]);

  const productionOrderStatusData = useMemo(() => {
    const statusCounts = filteredProductionOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<ProductionOrderStatus, number>);

    return (Object.keys(statusCounts) as ProductionOrderStatus[]).map(status => ({
      name: status,
      value: statusCounts[status],
      fill: STATUS_COLORS[status] || "hsl(var(--muted))",
    })).filter(item => item.value > 0);
  }, [filteredProductionOrders]);

  const topSkusByProducedQuantityData = useMemo(() => {
    const skuProduction: Record<string, { totalProduced: number; skuObject: SKU }> = {};
    // Para o Top SKUs, usamos todas as OPs, não apenas as filtradas,
    // pois o filtro de SKU é aplicado AO CLICAR neste gráfico.
    allProductionOrders.forEach(po => {
      if (po.status === 'Concluída' && po.producedQuantity && po.producedQuantity > 0) {
        const sku = findSkuById(po.skuId);
        if (sku) {
          if (!skuProduction[sku.id]) {
            skuProduction[sku.id] = { totalProduced: 0, skuObject: sku };
          }
          skuProduction[sku.id].totalProduced += po.producedQuantity;
        }
      }
    });

    return Object.values(skuProduction)
      .sort((a, b) => b.totalProduced - a.totalProduced)
      .slice(0, 5)
      .map((item, index) => ({
        skuCode: item.skuObject.code,
        skuId: item.skuObject.id,
        totalProduced: item.totalProduced,
        fill: CHART_COLORS[index % CHART_COLORS.length],
        skuObject: item.skuObject // Importante para o clique
      }));
  }, [allProductionOrders, findSkuById]);


  const completedPoDetails = useMemo(() => {
    return filteredProductionOrders
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
  }, [filteredProductionOrders, findSkuById]);

  const avgProductionTimePerSkuData = useMemo(() => {
    // Para este gráfico, faz sentido usar as OPs filtradas se um SKU estiver selecionado,
    // ou todas as OPs se nenhum SKU estiver selecionado (para mostrar o top 5 geral).
    const sourcePOs = selectedSkuFilter
      ? filteredProductionOrders // Se um SKU está filtrado, mostramos apenas ele (ou nada se não tiver dados)
      : allProductionOrders;    // Se nenhum SKU filtrado, mostramos o top 5 geral

    const completedPOs = sourcePOs.filter(
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
      .sort((a, b) => b.poCount - a.poCount) // Ordenar por contagem de OPs para mostrar os mais frequentes
      .slice(0, selectedSkuFilter ? 1 : 5); // Se SKU filtrado, mostrar só ele, senão top 5

    return skusWithAvgTime.map((item, index) => ({
      skuCode: item.skuCode,
      avgTimeFormatted: formatDuration(item.avgTimeSeconds),
      avgTimeSeconds: item.avgTimeSeconds,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [selectedSkuFilter, filteredProductionOrders, allProductionOrders, findSkuById]);

  const metaVsRealizadoOPData = useMemo(() => {
    const relevantPOs = filteredProductionOrders // Usa OPs filtradas
      .filter(po => po.status === 'Concluída' || po.status === 'Em Progresso')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 7);

    return relevantPOs.map(po => {
      const sku = findSkuById(po.skuId);
      return {
        name: `OP ${po.id.substring(0, 4)}... (${sku?.code || 'N/D'})`,
        meta: po.targetQuantity,
        realizado: po.producedQuantity || 0,
      };
    }).reverse();
  }, [filteredProductionOrders, findSkuById]);

  const handleSkuBarClick = (data: any) => {
    if (data && data.activePayload && data.activePayload.length > 0) {
      const clickedSkuObject = data.activePayload[0].payload.skuObject as SKU;
      if (clickedSkuObject) {
        setSelectedSkuFilter(clickedSkuObject);
      }
    }
  };

  const handleClearFilter = () => {
    setSelectedSkuFilter(null);
  };

  const handleSkuSelectChange = (skuId: string) => {
    if (skuId === "all") {
      setSelectedSkuFilter(null);
    } else {
      const sku = findSkuById(skuId);
      setSelectedSkuFilter(sku || null);
    }
  };


  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total de SKUs" value={<span className="text-primary">{totalSKUs}</span>} icon={Package} description="Número de SKUs cadastrados" />
        <MetricCard title="Ordens Abertas/Em Progresso" value={<span className="text-primary">{totalOpenOrInProgressPOs}</span>} icon={Factory} description={`Ordens pendentes ou em execução ${selectedSkuFilter ? `para ${selectedSkuFilter.code}`: ''}`} />
        <MetricCard title="Ordens Concluídas" value={<span className="text-primary">{completedPOsCount}</span>} icon={CheckCircle2} description={`Ordens de produção finalizadas ${selectedSkuFilter ? `para ${selectedSkuFilter.code}`: ''}`} />
        <MetricCard title="Tempo Médio de Produção" value={<span className="text-primary">{avgProductionTimeOverall}</span>} icon={Clock3} description={`Tempo médio por ordem concluída ${selectedSkuFilter ? `para ${selectedSkuFilter.code}`: '(Geral)'}`} />
      </div>

      <div className="flex items-center justify-start gap-4 mb-0 -mt-2">
        <Select onValueChange={handleSkuSelectChange} value={selectedSkuFilter?.id || "all"}>
          <SelectTrigger className="w-[280px] h-9">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por SKU..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os SKUs</SelectItem>
            {sortedSkus.map(sku => (
              <SelectItem key={sku.id} value={sku.id}>{sku.code} - {sku.description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedSkuFilter && (
          <Button onClick={handleClearFilter} variant="outline" size="sm" className="h-9">
            <FilterX className="mr-2 h-4 w-4" />
            Limpar Filtro: {selectedSkuFilter.code}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
        <ProductionChart
          productionOrders={filteredProductionOrders}
          demands={selectedSkuFilter ? filteredDemands : allDemands} // Passa demandas filtradas ou todas
          selectedSku={selectedSkuFilter}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <DemandFulfillmentCard
          demands={allDemands} // Passa todas as demandas, o filtro de SKU será aplicado dentro do card
          productionOrders={allProductionOrders} // Passa todas as OPs
          selectedSku={selectedSkuFilter}
        />
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Meta vs. Realizado por OP {selectedSkuFilter ? `(${selectedSkuFilter.code})` : ''}
            </CardTitle>
            <CardDescription>Comparativo de Quantidade Alvo e Produzida para OPs recentes.</CardDescription>
          </CardHeader>
          <CardContent>
            {metaVsRealizadoOPData.length > 0 ? (
              <ChartContainer config={{}} className="aspect-video max-h-[300px]">
                <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={metaVsRealizadoOPData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--foreground))" fontSize={10} interval={0} angle={-30} textAnchor="end" height={60} />
                    <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
                    <RechartsTooltip
                      cursor={{ fill: 'hsl(var(--muted))' }}
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
                      itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                      formatter={(value: number, name: string) => [value.toLocaleString('pt-BR') + ' un.', name.charAt(0).toUpperCase() + name.slice(1)]}
                    />
                    <RechartsLegend wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="meta" name="Meta" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} barSize={20} />
                    <Bar dataKey="realizado" name="Realizado" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} barSize={20} />
                  </BarChart>
                </RechartsResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma OP {selectedSkuFilter ? `para ${selectedSkuFilter.code} ` : ''}"Em Progresso" ou "Concluída" para exibir.</p>
            )}
          </CardContent>
        </Card>
      </div>


      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5 text-primary" />
              Distribuição de Status das OPs {selectedSkuFilter ? `(${selectedSkuFilter.code})` : ''}
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
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
                      itemStyle={{ color: 'hsl(var(--card-foreground))' }}
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
                          <text x={x} y={y} fill="hsl(var(--background))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold">
                            {`${(percent * 100).toFixed(0)}%`}
                          </text>
                        ) : null;
                      }}
                    >
                      {productionOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" />
                      ))}
                    </Pie>
                    <RechartsLegend wrapperStyle={{ color: 'hsl(var(--foreground))' }} />
                  </PieChart>
                </RechartsResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-center text-muted-foreground py-10">Nenhuma ordem de produção {selectedSkuFilter ? `para ${selectedSkuFilter.code} ` : ''}para exibir status.</p>
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
                  <BarChart data={topSkusByProducedQuantityData} layout="vertical" margin={{ right: 20, left: 10, bottom: 5 }} onClick={handleSkuBarClick}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                    <XAxis type="number" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis dataKey="skuCode" type="category" stroke="hsl(var(--foreground))" fontSize={12} tickLine={false} axisLine={false} width={80} interval={0} />
                    <RechartsTooltip
                        cursor={{ fill: 'hsl(var(--muted))' }}
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
                        itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                        formatter={(value: number) => [value.toLocaleString('pt-BR') + ' un.', 'Produzido']}
                    />
                    <Bar dataKey="totalProduced" radius={[0, 4, 4, 0]} className="cursor-pointer">
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
              Tempo Médio de Produção por SKU {selectedSkuFilter ? `(${selectedSkuFilter.code})` : ''}
            </CardTitle>
            <CardDescription>Top 5 SKUs com mais OPs concluídas e seus tempos médios.</CardDescription>
          </CardHeader>
          <CardContent>
            {avgProductionTimePerSkuData.length > 0 ? (
               <ChartContainer config={{}} className="aspect-video max-h-[300px]">
                <RechartsResponsiveContainer width="100%" height={300}>
                  <BarChart data={avgProductionTimePerSkuData} layout="vertical" margin={{ right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
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
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
                        itemStyle={{ color: 'hsl(var(--card-foreground))' }}
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
              <p className="text-center text-muted-foreground py-10">Dados insuficientes para exibir tempo médio por SKU {selectedSkuFilter ? `para ${selectedSkuFilter.code}` : ''}.</p>
            )}
          </CardContent>
        </Card>

      </div>

      <Card className="lg:col-span-3">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground/90">
            <ListChecks className="h-5 w-5 text-primary" />
            Detalhes de Ordens Concluídas {selectedSkuFilter ? `(${selectedSkuFilter.code})` : ''}
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
                    <TableHead className="text-center">Meta</TableHead>
                    <TableHead className="text-center">Qtd. Prod.</TableHead>
                    <TableHead className="text-center">Início</TableHead>
                    <TableHead className="text-center">Fim</TableHead>
                    <TableHead className="text-center">Tempo Líquido</TableHead>
                    <TableHead className="text-right">Seg/Unid.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {completedPoDetails.map((po) => (
                    <TableRow
                      key={po.id}
                      className="border-b-border hover:bg-muted/30"
                    >
                      <TableCell>
                        <div className="font-medium text-primary">{po.skuCode}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[200px]">{po.skuDescription}</div>
                      </TableCell>
                      <TableCell className="text-center">{po.targetQuantity.toLocaleString('pt-BR')} Un</TableCell>
                      <TableCell className="text-center">{po.producedQuantity?.toLocaleString('pt-BR') || '-'} Un</TableCell>
                      <TableCell className="text-center">
                        <ClientSideDateTime dateString={po.startTime} outputFormat="dd/MM/yyyy, HH:mm:ss" locale={ptBR} placeholder="-" />
                      </TableCell>
                      <TableCell className="text-center">
                        <ClientSideDateTime dateString={po.endTime} outputFormat="dd/MM/yyyy, HH:mm:ss" locale={ptBR} placeholder="-" />
                      </TableCell>
                      <TableCell className="text-center">{formatDuration(po.productionTime)}</TableCell>
                      <TableCell className={cn("text-right font-semibold", po.secondsPerUnit !== 'N/D' ? 'text-accent' : 'text-muted-foreground')}>
                        {po.secondsPerUnit}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-10">Nenhuma ordem de produção concluída {selectedSkuFilter ? `para ${selectedSkuFilter.code} ` : ''}para exibir.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
