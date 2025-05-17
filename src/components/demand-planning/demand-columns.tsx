
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
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[]
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
        const sku = findSkuById(row.getValue("skuId"));
        return sku ? (
          <div>
            <span className="text-primary font-medium">{sku.code}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({sku.description.substring(0,20)}{sku.description.length > 20 ? '...' : ''})
            </span>
          </div>
        ) : "SKU não encontrado";
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
        return <ClientSideDateTime dateString={monthYearStr} inputFormat="yyyy-MM" outputFormat="MMMM yyyy" locale={ptBR} />;
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
          textColorClass = "text-blue-400"; // Adjusted for dark theme
        } else if (progressPercentage >= 90) {
          progressBarClass = "progress-bar-green";
          textColorClass = "text-green-400"; // Adjusted for dark theme
        } else if (progressPercentage >= 70) {
          progressBarClass = "progress-bar-yellow";
          textColorClass = "text-yellow-400"; // Adjusted for dark theme
        } else {
          progressBarClass = "progress-bar-red";
          textColorClass = "text-red-400"; // Adjusted for dark theme
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
