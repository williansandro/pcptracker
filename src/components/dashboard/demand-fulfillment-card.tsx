"use client";

import { useAppContext } from '@/contexts/app-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Target } from 'lucide-react';
import { useMemo } from 'react';

export function DemandFulfillmentCard() {
  const { demands, productionOrders } = useAppContext();

  const fulfillmentData = useMemo(() => {
    if (demands.length === 0) {
      return { totalTarget: 0, totalProduced: 0, percentage: 0 };
    }

    const currentMonthYear = new Date().toISOString().slice(0, 7); // YYYY-MM

    const currentMonthDemands = demands.filter(d => d.monthYear === currentMonthYear);
    const totalTarget = currentMonthDemands.reduce((sum, d) => sum + d.targetQuantity, 0);

    let totalProduced = 0;
    currentMonthDemands.forEach(demand => {
      const completedPOsForSku = productionOrders.filter(
        po => po.skuId === demand.skuId && po.status === 'Completed' && po.endTime?.startsWith(currentMonthYear)
      );
      totalProduced += completedPOsForSku.reduce((sum, po) => sum + po.quantity, 0);
    });
    
    const percentage = totalTarget > 0 ? Math.min(Math.round((totalProduced / totalTarget) * 100), 100) : 0;

    return { totalTarget, totalProduced, percentage };
  }, [demands, productionOrders]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Atendimento à Demanda (Mês Atual)</CardTitle>
        <Target className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{fulfillmentData.percentage}%</div>
        <p className="text-xs text-muted-foreground">
          {fulfillmentData.totalProduced.toLocaleString()} de {fulfillmentData.totalTarget.toLocaleString()} unidades
        </p>
        <Progress value={fulfillmentData.percentage} className="mt-2 h-3" />
      </CardContent>
    </Card>
  );
}
