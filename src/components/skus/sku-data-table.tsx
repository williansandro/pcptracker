
"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/data-table-pagination";
import { SkuFormDialog } from "./sku-form-dialog";
import { useAppContext } from "@/contexts/app-context";
import type { SKU } from "@/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function SkuDataTable<TData extends SKU, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const { deleteSelectedSkus } = useAppContext();
  const { toast } = useToast();

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleDeleteSelected = () => {
    const idsToDelete = selectedRows.map(row => row.original.id);
    try {
      const result = deleteSelectedSkus(idsToDelete);
      
      let toastTitle = "Resultado da Exclusão";
      const descriptions: string[] = [];

      if (result.deletedCount > 0) {
        descriptions.push(`${result.deletedCount} SKU(s) foram excluído(s) com sucesso.`);
        if (result.notDeleted.length === 0) {
          toastTitle = "SKUs Excluídos";
        }
      }

      if (result.notDeleted.length > 0) {
        const notDeletedMessages = result.notDeleted.map(item => `"${item.code}" (possui ${item.reason})`).join(', ');
        descriptions.push(`${result.notDeleted.length} SKU(s) não puderam ser excluídos: ${notDeletedMessages}.`);
        if (result.deletedCount === 0) {
          toastTitle = "Falha ao Excluir SKUs";
        }
      }
      
      if (descriptions.length > 0) {
        toast({
          title: toastTitle,
          description: descriptions.join(' '),
          variant: result.deletedCount > 0 && result.notDeleted.length === 0 ? "default" : (result.notDeleted.length > 0 ? "destructive" : "default"),
          duration: (result.notDeleted.length > 0 || result.deletedCount > 0) ? 7000 : 5000,
        });
      }


      if (result.deletedCount > 0) {
        table.resetRowSelection();
      }
    } catch (error: any) {
      toast({
        title: "Erro Inesperado ao Excluir",
        description: error.message || "Não foi possível excluir os SKUs selecionados.",
        variant: "destructive",
      });
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filtrar SKUs por código..."
          value={(table.getColumn("code")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("code")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        <div className="flex items-center space-x-2">
          {selectedRows.length > 0 && (
            <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Selecionado(s) ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedRows.length} SKU(s) selecionado(s)?
                    SKUs vinculados a Ordens de Produção ou Demandas não serão excluídos. Esta ação não pode ser desfeita para os SKUs elegíveis.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Excluir {selectedRows.length} SKU(s)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <SkuFormDialog />
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className={cn(
                    index % 2 !== 0 ? "bg-[#EBEBEB]" : ""
                  )}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Nenhum SKU encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
    </div>
  );
}

