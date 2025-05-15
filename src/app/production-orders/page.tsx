"use client";

import { useAppContext } from "@/contexts/app-context";
import { PoDataTable } from "@/components/production-orders/po-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ProductionOrdersPage() {
  const { productionOrders } = useAppContext();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Ordens de Produção</CardTitle>
          <CardDescription>
            Crie, acompanhe e gerencie todas as suas Ordens de Produção (OPs).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PoDataTable data={productionOrders} />
        </CardContent>
      </Card>
    </div>
  );
}
