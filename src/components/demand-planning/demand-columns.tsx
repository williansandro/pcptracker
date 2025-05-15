
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
        return sku ? `${sku.code} (${sku.description.substring(0,20)}...)` : "SKU não encontrado";
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
      cell: ({ row }) => (row.getValue("targetQuantity") as number).toLocaleString('pt-BR'),
    },
    {
      id: "producedQuantity",
      header: "Qtd. Produzida",
      cell: ({ row }) => {
        const demand = row.original;
        const productionOrders = getProductionOrdersBySku(demand.skuId);
        const producedInMonth = productionOrders
          .filter(po => po.status === 'Concluída' && po.endTime?.startsWith(demand.monthYear))
          .reduce((sum, po) => sum + po.quantity, 0);
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
          .filter(po => po.status === 'Concluída' && po.endTime?.startsWith(demand.monthYear))
          .reduce((sum, po) => sum + po.quantity, 0);
        
        const progressPercentage = demand.targetQuantity > 0 
          ? Math.min(Math.round((producedInMonth / demand.targetQuantity) * 100), 100) 
          : 0;
        return (
          <div className="flex items-center">
            <Progress value={progressPercentage} className="w-[80px] h-3 mr-2" />
            <span>{progressPercentage}%</span>
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
