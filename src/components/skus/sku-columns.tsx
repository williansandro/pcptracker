
"use client";

import type { ColumnDef } from "@tanstack/react-table";
import type { SKU } from "@/types";
import { SkuActions } from "./sku-actions";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClientSideDateTime } from "@/components/client-side-date-time";
import { ptBR } from 'date-fns/locale';

export const skuColumns: ColumnDef<SKU>[] = [
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
    accessorKey: "code",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Código
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => <div className="font-medium text-primary">{row.getValue("code")}</div>,
  },
  {
    accessorKey: "description",
    header: "Descrição",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue("description")}</div>,
  },
  {
    accessorKey: "standardTimeSeconds",
    header: "Tempo Padrão",
    cell: ({ row }) => {
      const seconds = row.getValue("standardTimeSeconds") as number | undefined;
      return seconds !== undefined ? `${seconds} seg` : "-";
    },
  },
  {
    accessorKey: "assemblyTimeSeconds",
    header: "Tempo Montagem",
    cell: ({ row }) => {
      const seconds = row.getValue("assemblyTimeSeconds") as number | undefined;
      return seconds !== undefined ? `${seconds} seg` : "-";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data Criação
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const dateString = row.getValue("createdAt") as string;
      return <div><ClientSideDateTime dateString={dateString} outputFormat="dd/MM/yyyy HH:mm" locale={ptBR} placeholder="-" /></div>;
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <SkuActions sku={row.original} />,
    enableSorting: false,
    enableHiding: false,
  },
];
