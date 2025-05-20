
"use client";

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ClientSideDateTime } from '@/components/client-side-date-time';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart, Pie, Cell, Legend as RechartsLegend, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ResponsiveContainer as RechartsResponsiveContainer } from 'recharts';
import type { SKU, ProductionOrder, ProductionOrderStatus } from '@/types';
import { formatDuration, cn } from "@/lib/utils";
import { ptBR } from 'date-fns/locale';

interface SkuProductionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sku: SKU | null;
  productionOrders: ProductionOrder[];
}

const STATUS_COLORS_MODAL: Record<ProductionOrderStatus, string> = {
  Aberta: "hsl(var(--chart-3))",
  "Em Progresso": "hsl(var(--chart-4))",
  Concluída: "hsl(var(--chart-2))",
  Cancelada: "hsl(var(--chart-5))",
};

const CHART_COLORS_MODAL = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

export function SkuProductionDetailsModal({
  isOpen,
  onClose,
  sku,
  productionOrders,
}: SkuProductionDetailsModalProps) {

  const relevantPOs = useMemo(() => {
    if (!sku) return [];
    return productionOrders.filter(po => po.skuId === sku.id);
  }, [sku, productionOrders]);

  const summary = useMemo(() => {
    if (!sku) return null;
    const completedPOs = relevantPOs.filter(po => po.status === 'Concluída');
    const totalProduced = completedPOs.reduce((sum, po) => sum + (po.producedQuantity || 0), 0);
    const totalProductionTimeSeconds = completedPOs.reduce((sum, po) => sum + (po.productionTime || 0), 0);
    const avgProductionTimeSeconds = completedPOs.length > 0 ? totalProductionTimeSeconds / completedPOs.length : 0;

    return {
      totalPOs: relevantPOs.length,
      completedPOsCount: completedPOs.length,
      totalProduced,
      avgProductionTimeFormatted: formatDuration(avgProductionTimeSeconds),
    };
  }, [sku, relevantPOs]);

  const statusDistributionData = useMemo(() => {
    if (!sku) return [];
    const statusCounts = relevantPOs.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<ProductionOrderStatus, number>);

    return (Object.keys(statusCounts) as ProductionOrderStatus[]).map(status => ({
      name: status,
      value: statusCounts[status],
      fill: STATUS_COLORS_MODAL[status] || "hsl(var(--muted))",
    })).filter(item => item.value > 0);
  }, [sku, relevantPOs]);

  const metaVsRealizadoData = useMemo(() => {
    if (!sku) return [];
    return relevantPOs
      .filter(po => po.status === 'Concluída' || po.status === 'Em Progresso')
      .sort((a, b) => (b.createdAt && a.createdAt) ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0)
      .slice(0, 5)
      .map(po => ({
        name: `OP ${po.id.substring(0, 4)}...`,
        meta: po.targetQuantity,
        realizado: po.producedQuantity || 0,
      })).reverse();
  }, [sku, relevantPOs]);

  if (!isOpen || !sku) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Detalhes de Produção para SKU: <span className="text-primary">{sku.code}</span></DialogTitle>
          <DialogDescription>{sku.description}</DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-6">
          <div className="space-y-6 py-4">
            {summary && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumo Geral</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Total de OPs</p>
                    <p className="font-semibold text-lg">{summary.totalPOs}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">OPs Concluídas</p>
                    <p className="font-semibold text-lg">{summary.completedPOsCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Produzido</p>
                    <p className="font-semibold text-lg">{summary.totalProduced.toLocaleString('pt-BR')} un</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Tempo Médio Prod.</p>
                    <p className="font-semibold text-lg">{summary.avgProductionTimeFormatted}</p>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Distribuição de Status das OPs</CardTitle>
                </CardHeader>
                <CardContent>
                  {statusDistributionData.length > 0 ? (
                    <ChartContainer config={{}} className="mx-auto aspect-square max-h-[250px]">
                      <RechartsResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <RechartsTooltip
                            cursor={{ fill: "hsl(var(--muted))" }}
                            content={<ChartTooltipContent hideLabel />}
                          />
                          <Pie
                            data={statusDistributionData}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            labelLine={false}
                            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                              const RADIAN = Math.PI / 180;
                              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              return (percent * 100) > 5 ? (
                                <text x={x} y={y} fill="hsl(var(--card-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontWeight="bold">
                                  {`${(percent * 100).toFixed(0)}%`}
                                </text>
                              ) : null;
                            }}
                          >
                            {statusDistributionData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.fill} stroke="hsl(var(--card))" />
                            ))}
                          </Pie>
                          <RechartsLegend wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                        </PieChart>
                      </RechartsResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">Nenhuma OP para este SKU.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Meta vs. Realizado (OPs Recentes)</CardTitle>
                </CardHeader>
                <CardContent>
                  {metaVsRealizadoData.length > 0 ? (
                    <ChartContainer config={{}} className="max-h-[250px]">
                      <RechartsResponsiveContainer width="100%" height={250}>
                        <BarChart data={metaVsRealizadoData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                          <XAxis dataKey="name" fontSize={10} stroke="hsl(var(--foreground))" />
                          <YAxis fontSize={10} stroke="hsl(var(--foreground))" />
                          <RechartsTooltip
                            cursor={{ fill: 'hsl(var(--muted))' }}
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', color: 'hsl(var(--card-foreground))' }}
                            itemStyle={{ color: 'hsl(var(--card-foreground))' }}
                            formatter={(value: number, name: string) => [value.toLocaleString('pt-BR') + ' un.', name.charAt(0).toUpperCase() + name.slice(1)]}
                          />
                          <RechartsLegend wrapperStyle={{ fontSize: '12px', color: 'hsl(var(--foreground))' }} />
                          <Bar dataKey="meta" name="Meta" fill={CHART_COLORS_MODAL[0]} radius={[3, 3, 0, 0]} barSize={15} />
                          <Bar dataKey="realizado" name="Realizado" fill={CHART_COLORS_MODAL[1]} radius={[3, 3, 0, 0]} barSize={15} />
                        </BarChart>
                      </RechartsResponsiveContainer>
                    </ChartContainer>
                  ) : (
                    <p className="text-center text-sm text-muted-foreground py-10">Nenhuma OP concluída ou em progresso para exibir.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {relevantPOs.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lista de Ordens de Produção</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="p-2 text-left font-semibold text-muted-foreground">Status</th>
                          <th className="p-2 text-right font-semibold text-muted-foreground">Meta</th>
                          <th className="p-2 text-right font-semibold text-muted-foreground">Produzido</th>
                          <th className="p-2 text-left font-semibold text-muted-foreground">Início</th>
                          <th className="p-2 text-left font-semibold text-muted-foreground">Término</th>
                          <th className="p-2 text-right font-semibold text-muted-foreground">Tempo Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {relevantPOs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(po => (
                          <tr key={po.id} className="border-b border-border hover:bg-muted/30">
                            <td className="p-2">
                               <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium",
                                po.status === 'Concluída' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100' :
                                po.status === 'Em Progresso' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100' :
                                po.status === 'Aberta' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-100' :
                                po.status === 'Cancelada' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                              )}>
                                {po.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">{po.targetQuantity.toLocaleString('pt-BR')}</td>
                            <td className="p-2 text-right">{po.producedQuantity?.toLocaleString('pt-BR') || '-'}</td>
                            <td className="p-2"><ClientSideDateTime dateString={po.startTime} outputFormat="dd/MM, HH:mm" locale={ptBR} placeholder="-" /></td>
                            <td className="p-2"><ClientSideDateTime dateString={po.endTime} outputFormat="dd/MM, HH:mm" locale={ptBR} placeholder="-" /></td>
                            <td className="p-2 text-right">{po.productionTime ? formatDuration(po.productionTime) : '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={onClose} variant="outline">Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

    