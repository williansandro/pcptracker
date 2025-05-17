
"use client";

import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/data-table-pagination";
import { PoFormDialog } from "./po-form-dialog";
import { useAppContext } from "@/contexts/app-context";
import { getPoColumns } from "./po-columns";
import type { ProductionOrder, SKU } from "@/types";
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
import { Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface PoDataTableProps<TData extends ProductionOrder, TValue> {
  data: TData[];
  skus: SKU[];
  findSkuById: (skuId: string) => SKU | undefined;
}

export function PoDataTable<TData extends ProductionOrder, TValue>({
  data,
  skus,
  findSkuById,
}: PoDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [skuFilter, setSkuFilter] = React.useState<string>("all");

  const { deleteSelectedProductionOrders } = useAppContext();
  const { toast } = useToast();

  const columns = React.useMemo(
    () => getPoColumns(findSkuById),
    [findSkuById]
  );

  const sortedSkus = React.useMemo(() =>
    [...skus].sort((a, b) => a.code.localeCompare(b.code)),
  [skus]);

  const filteredData = React.useMemo(() => {
    if (skuFilter === "all") {
      return data;
    }
    return data.filter(po => po.skuId === skuFilter);
  }, [data, skuFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Mantido para outros filtros, se adicionados
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnVisibility,
      rowSelection,
    },
  });

  const selectedRows = table.getFilteredSelectedRowModel().rows;

  const handleDeleteSelected = () => {
    const idsToDelete = selectedRows.map(row => row.original.id);
    try {
      deleteSelectedProductionOrders(idsToDelete);
      toast({
        title: "Ordens de Produção Excluídas",
        description: `${idsToDelete.length} OP(s) foram excluídas com sucesso.`,
      });
      table.resetRowSelection();
    } catch (error) {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir as OPs selecionadas.",
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
            {sortedSkus.map(s => (
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
                  Excluir Selecionada(s) ({selectedRows.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar Exclusão em Massa</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir {selectedRows.length} Ordem(ns) de Produção selecionada(s)?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Excluir {selectedRows.length} OP(s)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <PoFormDialog />
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
                  Nenhuma Ordem de Produção encontrada {skuFilter !== "all" ? `para o SKU selecionado` : ''}.
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
