
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ProductionOrder, SKU } from "@/types";
import { PoActions } from "./po-actions";
import { PoTimer } from "./po-timer";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ClientSideDateTime } from "@/components/client-side-date-time";
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";


export const getPoColumns = (findSkuById: (skuId: string) => SKU | undefined): ColumnDef<ProductionOrder>[] => {
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
      accessorKey: "producedQuantity",
      header: "Qtd. Produzida",
      cell: ({ row }) => {
        const po = row.original;
        return po.status === 'Concluída' && typeof po.producedQuantity === 'number'
          ? po.producedQuantity.toLocaleString('pt-BR')
          : "-";
      },
    },
    {
      id: "fulfillment",
      header: "Atingimento Meta",
      cell: ({ row }) => {
        const po = row.original;
        if (po.status !== 'Concluída' || typeof po.producedQuantity !== 'number' || po.targetQuantity <= 0) {
          return "-";
        }
        const percentage = Math.round((po.producedQuantity / po.targetQuantity) * 100);
        let progressBarClass = "";
        let textColorClass = "";

        if (percentage > 100) {
          progressBarClass = "progress-bar-blue";
          textColorClass = "text-blue-600";
        } else if (percentage >= 90) {
          progressBarClass = "progress-bar-green";
          textColorClass = "text-green-600";
        } else if (percentage >= 70) {
          progressBarClass = "progress-bar-yellow";
          textColorClass = "text-yellow-600";
        } else {
          progressBarClass = "progress-bar-red";
          textColorClass = "text-red-600";
        }

        return (
          <div className="flex items-center w-28">
            <Progress value={Math.min(percentage, 100)} className={cn("h-3 mr-2", progressBarClass)} />
            <span className={cn("text-xs font-semibold", textColorClass)}>{percentage}%</span>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.getValue("status") as string;
        let variant: "default" | "secondary" | "destructive" | "outline" = "default";
        let className = "";

        switch (status) {
          case "Concluída":
            variant = "default";
            className = "bg-green-500 hover:bg-green-600 text-white";
            break;
          case "Em Progresso":
            variant = "outline";
            className = "bg-yellow-500 hover:bg-yellow-600 text-black";
            break;
          case "Aberta":
            variant = "secondary";
            className = "bg-blue-500 hover:bg-blue-600 text-white";
            break;
          case "Cancelada":
            variant = "destructive";
            className = "bg-red-500 hover:bg-red-600 text-white";
            break;
          default:
            variant = "default";
        }

        return <Badge variant={variant} className={className}>{status}</Badge>;
      },
    },
    {
      id: "timer",
      header: "Tempo de Produção",
      cell: ({ row }) => <PoTimer productionOrder={row.original} />,
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Data Criação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const dateString = row.getValue("createdAt") as string;
        return <div><ClientSideDateTime dateString={dateString} outputFormat="dd/MM/yyyy HH:mm" locale={ptBR} /></div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <PoActions productionOrder={row.original} />,
    },
  ];
}
