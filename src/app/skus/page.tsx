
"use client";

import { useAppContext } from "@/contexts/app-context";
import { skuColumns } from "@/components/skus/sku-columns";
import { SkuDataTable } from "@/components/skus/sku-data-table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SkuInlineForm } from "@/components/skus/sku-inline-form"; // Re-adicionando a importação

export default function SkusPage() {
  const { skus } = useAppContext();

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de SKUs</CardTitle>
          <CardDescription>
            Adicione, edite e visualize todos os seus Stock Keeping Units (SKUs).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6"> {/* Adicionando um wrapper para o formulário inline com margem inferior */}
            <SkuInlineForm />
          </div>
          <SkuDataTable columns={skuColumns} data={skus} />
        </CardContent>
      </Card>
    </div>
  );
}
