
"use client";

import { useAppContext } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { useMemo } from 'react';
import { format } from 'date-fns';
import type { SKU, Demand, ProductionOrder } from '@/types';

interface DemandFulfillmentCardProps {
  demands: Demand[];
  productionOrders: ProductionOrder[];
  selectedSku?: SKU | null;
}

export function DemandFulfillmentCard({ demands, productionOrders, selectedSku }: DemandFulfillmentCardProps) {
  const fulfillmentData = useMemo(() => {
    const currentDate = new Date();
    const currentMonthYear = format(currentDate, 'yyyy-MM');

    // Filtra demandas pelo SKU selecionado, se houver
    const relevantDemandsSource = selectedSku
      ? demands.filter(d => d.skuId === selectedSku.id)
      : demands;

    const currentMonthDemands = relevantDemandsSource.filter(d => d.monthYear === currentMonthYear);

    if (currentMonthDemands.length === 0 && !selectedSku) { // Se não houver demandas globais para o mês
        return { totalTarget: 0, totalProduced: 0, percentage: 0, skuCode: null };
    }
    if (currentMonthDemands.length === 0 && selectedSku) { // Se não houver demandas para o SKU selecionado no mês
        return { totalTarget: 0, totalProduced: 0, percentage: 0, skuCode: selectedSku.code };
    }


    const totalTarget = currentMonthDemands.reduce((sum, d) => sum + d.targetQuantity, 0);

    let totalProduced = 0;

    // Filtra ordens de produção pelo SKU selecionado, se houver, ANTES de iterar pelas demandas do mês.
    // Isso otimiza o loop interno.
    const relevantProductionOrdersSource = selectedSku
      ? productionOrders.filter(po => po.skuId === selectedSku.id)
      : productionOrders;

    // Itera sobre as demandas do mês atual (que já foram filtradas por SKU, se aplicável)
    // para calcular a produção correspondente a essas demandas.
    currentMonthDemands.forEach(demand => {
      const completedPOsForSkuInMonth = relevantProductionOrdersSource.filter(
        po =>
          po.skuId === demand.skuId && // Garante que estamos olhando para o SKU correto da demanda
          po.status === 'Concluída' &&
          po.endTime?.startsWith(currentMonthYear) &&
          typeof po.producedQuantity === 'number'
      );
      totalProduced += completedPOsForSkuInMonth.reduce((sum, po) => sum + po.producedQuantity!, 0);
    });

    const percentage = totalTarget > 0 ? Math.min(Math.round((totalProduced / totalTarget) * 100), 100) : 0;

    return { totalTarget, totalProduced, percentage, skuCode: selectedSku?.code };
  }, [demands, productionOrders, selectedSku]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atendimento à Demanda (Mês Atual{fulfillmentData.skuCode ? ` - ${fulfillmentData.skuCode}` : ''})</CardTitle>
        <Target className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{fulfillmentData.percentage}%</div>
        <p className="text-xs text-muted-foreground">
          {fulfillmentData.totalProduced.toLocaleString('pt-BR')} de {fulfillmentData.totalTarget.toLocaleString('pt-BR')} unidades
          {/* A indicação do SKU já está no título do card */}
        </p>
        <Progress value={fulfillmentData.percentage} className="mt-2 h-3" />
      </CardContent>
    </Card>
  );
}
