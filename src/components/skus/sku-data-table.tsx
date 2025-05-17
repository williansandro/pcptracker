
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
  type ColumnFiltersState, // Não mais usado diretamente para filtro de código via input
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
// import { Input } from "@/components/ui/input"; // Removido
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/data-table-pagination";
// SkuFormDialog não é mais usado para "Adicionar" aqui, SkuInlineForm cuida disso.
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
} from "@/components/ui/alert-dialog";
import { Trash2, Filter } from "lucide-react"; // Adicionado Filter
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { SkuInlineForm } from "./sku-inline-form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"; // Adicionado

interface DataTableProps<TData extends SKU, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[]; // Recebe todos os SKUs
}

export function SkuDataTable<TData extends SKU, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  // const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]); // Não mais usado para filtro de código
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [skuFilter, setSkuFilter] = React.useState<string>("all"); // para ID do SKU ou "all"

  const { deleteSelectedSkus } = useAppContext();
  const { toast } = useToast();

  const sortedSkusForDropdown = React.useMemo(() =>
    [...data].sort((a, b) => a.code.localeCompare(b.code)),
  [data]);

  const filteredData = React.useMemo(() => {
    if (skuFilter === "all") {
      return data;
    }
    return data.filter(sku => sku.id === skuFilter);
  }, [data, skuFilter]);

  const table = useReactTable({
    data: filteredData, // Usar dados filtrados
    columns,
    onSortingChange: setSorting,
    // onColumnFiltersChange: setColumnFilters, // Não mais usado para filtro de código
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      // columnFilters, // Não mais usado para filtro de código
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
        <Select onValueChange={setSkuFilter} value={skuFilter}>
          <SelectTrigger className="w-[280px] h-10">
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Filtrar por SKU..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os SKUs</SelectItem>
            {sortedSkusForDropdown.map(s => (
              <SelectItem key={s.id} value={s.id}>{s.code} - {s.description}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          {/* O botão de adicionar é agora o formulário inline, não mais um SkuFormDialog aqui */}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id} className="py-3">
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
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="border-b-border hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
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
                  Nenhum SKU encontrado{skuFilter !== "all" ? " para o filtro selecionado" : ""}.
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
