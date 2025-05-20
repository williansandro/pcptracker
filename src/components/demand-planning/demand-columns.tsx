
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { Demand, ProductionOrder, SKU } from "@/types";
import { DemandActions } from "./demand-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ClientSideDateTime } from "@/components/client-side-date-time";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";

export const getDemandColumns = (
  findSkuById: (skuId: string) => SKU | undefined,
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[],
  onSkuClick: (sku: SKU) => void
): ColumnDef<Demand>[] => {

  return [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Selecionar todas"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Selecionar linha"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "skuId",
      header: "SKU",
      cell: ({ row }) => {
        const skuIdValue = row.getValue("skuId") as string;
        const sku = findSkuById(skuIdValue);
        if (!sku) {
          return <div className="text-muted-foreground">SKU ID: {skuIdValue?.substring(0,6)}... N/E</div>;
        }
        return (
          <Button
            variant="link"
            className="p-0 h-auto text-left"
            onClick={() => {
              if (sku && typeof onSkuClick === 'function') {
                 onSkuClick(sku);
              }
            }}
            title={`Ver detalhes de ${sku.code}`}
          >
            <div>
              <span className="text-primary font-semibold">{sku.code}</span>
              <div className="text-xs text-muted-foreground font-normal truncate max-w-[150px]">
                ({sku.description})
              </div>
            </div>
          </Button>
        );
      },
    },
    {
      accessorKey: "monthYear",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Mês/Ano
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const monthYearStr = row.getValue("monthYear") as string;
        return <ClientSideDateTime dateString={monthYearStr} inputFormat="yyyy-MM" outputFormat="MMMM yyyy" locale={ptBR} placeholder="Data Inválida"/>;
      }
    },
    {
      accessorKey: "targetQuantity",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Qtd. Alvo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const value = row.getValue("targetQuantity");
        return typeof value === 'number' ? value.toLocaleString('pt-BR') : "-";
      },
    },
    {
      id: "producedQuantity",
      header: "Qtd. Produzida",
      cell: ({ row }) => {
        const demand = row.original;
        const productionOrders = getProductionOrdersBySku(demand.skuId);
        const producedInMonth = productionOrders
          .filter(po => po.status === 'Concluída' && po.endTime?.startsWith(demand.monthYear) && typeof po.producedQuantity === 'number')
          .reduce((sum, po) => sum + po.producedQuantity!, 0);
        return producedInMonth.toLocaleString('pt-BR');
      },
    },
    {
      id: "progress",
      header: "Progresso",
      cell: ({ row }) => {
        const demand = row.original;
        const productionOrders = getProductionOrdersBySku(demand.skuId);
        const producedInMonth = productionOrders
          .filter(po => po.status === 'Concluída' && po.endTime?.startsWith(demand.monthYear) && typeof po.producedQuantity === 'number')
          .reduce((sum, po) => sum + po.producedQuantity!, 0);

        const targetQuantity = typeof demand.targetQuantity === 'number' ? demand.targetQuantity : 0;
        const progressPercentage = targetQuantity > 0
          ? Math.round((producedInMonth / targetQuantity) * 100)
          : 0;

        let progressBarClass = "";
        let textColorClass = "";

        if (progressPercentage > 100) {
          progressBarClass = "progress-bar-blue";
          textColorClass = "text-blue-600 dark:text-blue-400";
        } else if (progressPercentage >= 90) {
          progressBarClass = "progress-bar-green";
          textColorClass = "text-green-600 dark:text-green-400";
        } else if (progressPercentage >= 70) {
          progressBarClass = "progress-bar-yellow";
          textColorClass = "text-yellow-700 dark:text-yellow-400"; // Ajustado para melhor legibilidade em tema claro
        } else {
          progressBarClass = "progress-bar-red";
          textColorClass = "text-red-600 dark:text-red-400";
        }
        
        return (
          <div className="flex items-center w-28">
            <Progress value={Math.min(progressPercentage, 100)} className={cn("h-3 mr-2", progressBarClass)} />
            <span className={cn("text-xs font-semibold", textColorClass)}>{progressPercentage}%</span>
          </div>
        );
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <DemandActions demand={row.original} />,
    },
  ];
};

    