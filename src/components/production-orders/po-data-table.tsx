
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
} from "@tanstack/react-table";
import { format, parseISO } from 'date-fns';

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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2, Filter, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const [monthYearFilter, setMonthYearFilter] = React.useState<string>("");

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
    let MêsAno = data;

    if (skuFilter !== "all") {
      MêsAno = MêsAno.filter(po => po.skuId === skuFilter);
    }

    if (monthYearFilter) {
      MêsAno = MêsAno.filter(po => {
        if (!po.createdAt) return false;
        try {
          const poMonthYear = format(parseISO(po.createdAt), "yyyy-MM");
          return poMonthYear === monthYearFilter;
        } catch (error) {
          console.error("Erro ao formatar data para filtro:", po.createdAt, error);
          return false;
        }
      });
    }
    return MêsAno;
  }, [data, skuFilter, monthYearFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
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

  const clearMonthYearFilter = () => {
    setMonthYearFilter("");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:gap-2">
          <div className="grid w-full md:w-[280px] items-center gap-1.5">
            <Label htmlFor="sku-filter-po" className="text-xs text-muted-foreground">Filtrar por SKU</Label>
            <Select onValueChange={setSkuFilter} value={skuFilter} >
              <SelectTrigger className="h-10" id="sku-filter-po">
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
          </div>
          <div className="grid w-full md:w-[200px] items-center gap-1.5">
             <Label htmlFor="month-year-filter-po" className="text-xs text-muted-foreground">Filtrar por Mês/Ano (Criação)</Label>
            <div className="flex items-center">
              <Input
                type="month"
                id="month-year-filter-po"
                value={monthYearFilter}
                onChange={(e) => setMonthYearFilter(e.target.value)}
                className="h-10"
              />
              {monthYearFilter && (
                <Button onClick={clearMonthYearFilter} variant="ghost" size="icon" className="ml-1 h-9 w-9">
                  <XCircle className="h-4 w-4 text-muted-foreground" />
                </Button>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2 self-end md:self-end">
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
      <div className="rounded-md border overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-b-border">
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
                  Nenhuma Ordem de Produção encontrada {skuFilter !== "all" || monthYearFilter ? `para os filtros aplicados` : ''}.
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
