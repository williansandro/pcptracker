"use client";

import { MetricCard } from '@/components/dashboard/metric-card';
import { ProductionChart } from '@/components/dashboard/production-chart';
import { DemandFulfillmentCard } from '@/components/dashboard/demand-fulfillment-card';
import { useAppContext } from '@/contexts/app-context';
import { Package, Factory, CheckCircle2, Clock3 } from 'lucide-react';
import { useMemo } from 'react';

export default function DashboardPage() {
  const { skus, productionOrders } = useAppContext();

  const totalSKUs = useMemo(() => skus.length, [skus]);
  
  const openPOs = useMemo(() => productionOrders.filter(po => po.status === 'Open' || po.status === 'In Progress').length, [productionOrders]);
  
  const completedPOs = useMemo(() => productionOrders.filter(po => po.status === 'Completed').length, [productionOrders]);

  const avgProductionTime = useMemo(() => {
    const completedWithTime = productionOrders.filter(po => po.status === 'Completed' && po.productionTime);
    if (completedWithTime.length === 0) return 'N/A';
    const totalTimeSeconds = completedWithTime.reduce((sum, po) => sum + (po.productionTime || 0), 0);
    const avgTimeSeconds = totalTimeSeconds / completedWithTime.length;
    const hours = Math.floor(avgTimeSeconds / 3600);
    const minutes = Math.floor((avgTimeSeconds % 3600) / 60);
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
  }, [productionOrders]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total SKUs" value={totalSKUs} icon={Package} description="Número de SKUs cadastrados" />
        <MetricCard title="Ordens Abertas" value={openPOs} icon={Factory} description="Ordens em aberto ou em progresso" />
        <MetricCard title="Ordens Concluídas" value={completedPOs} icon={CheckCircle2} description="Ordens de produção finalizadas" />
        <MetricCard title="Tempo Médio Produção" value={avgProductionTime} icon={Clock3} description="Tempo médio por ordem concluída" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <ProductionChart />
        <DemandFulfillmentCard />
      </div>
      
      {/* Placeholder for more charts or tables */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Desempenho por SKU</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Gráfico de desempenho por SKU em breve.</p>
        </CardContent>
      </Card> */}
    </div>
  );
}
