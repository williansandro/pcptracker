
"use client";

import { useAppContext } from "@/contexts/app-context";
import { DemandDataTable } from "@/components/demand-planning/demand-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function DemandPlanningPage() {
  const { demands, skus, findSkuById, getProductionOrdersBySku } = useAppContext();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Planejamento de Demanda</CardTitle>
          <CardDescription>
            Gerencie as metas de produção mensais para cada SKU e acompanhe o progresso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <DemandDataTable
            data={demands}
            skus={skus}
            findSkuById={findSkuById}
            getProductionOrdersBySku={getProductionOrdersBySku}
          />
        </CardContent>
      </Card>
    </div>
  );
}
