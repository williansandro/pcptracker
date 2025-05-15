
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { ProductionOrder, SKU } from "@/types";
import { PoActions } from "./po-actions";
import { PoTimer } from "./po-timer";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
// Removed: import { format } from 'date-fns'; 
import { ClientSideDateTime } from "@/components/client-side-date-time";


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
      accessorKey: "quantity",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Qtd.
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
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
        if (status === "Completed") variant = "default"; 
        else if (status === "In Progress") variant = "outline"; 
        else if (status === "Open") variant = "secondary";
        else if (status === "Cancelled") variant = "destructive";
        
        return <Badge variant={variant} className={
          status === "Completed" ? "bg-green-500 hover:bg-green-600 text-white" :
          status === "In Progress" ? "bg-yellow-500 hover:bg-yellow-600 text-black" :
          status === "Open" ? "bg-blue-500 hover:bg-blue-600 text-white" :
          status === "Cancelled" ? "bg-red-500 hover:bg-red-600 text-white" : ""
        }>{status}</Badge>;
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
        return <div><ClientSideDateTime dateString={dateString} outputFormat="dd/MM/yyyy HH:mm" /></div>;
      },
    },
    {
      id: "actions",
      cell: ({ row }) => <PoActions productionOrder={row.original} />,
    },
  ];
}
