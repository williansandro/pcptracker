
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
import { DemandFormDialog } from "./demand-form-dialog";
import { getDemandColumns } from "./demand-columns";
import { useAppContext } from "@/contexts/app-context";
import type { Demand, SKU, ProductionOrder } from "@/types";
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
import { Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SkuProductionDetailsModal } from "./sku-production-details-modal"; 

interface DemandDataTableProps<TData extends Demand, TValue> {
  data: TData[];
  skus: SKU[];
  productionOrders: ProductionOrder[];
  findSkuById: (skuId: string) => SKU | undefined;
  getProductionOrdersBySku: (skuId: string) => ProductionOrder[];
}

export function DemandDataTable<TData extends Demand, TValue>({
  data,
  skus,
  productionOrders: propProductionOrders, // Renamed prop
  findSkuById,
  getProductionOrdersBySku,
}: DemandDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [skuFilter, setSkuFilter] = React.useState<string>("all");

  const [isSkuDetailsModalOpen, setIsSkuDetailsModalOpen] = React.useState(false);
  const [selectedSkuDataForModal, setSelectedSkuDataForModal] = React.useState<{sku: SKU, productionOrders: ProductionOrder[]} | null>(null);

  const { deleteSelectedDemands } = useAppContext();
  const { toast } = useToast();

  // Ensure productionOrders is always an array for local use
  const productionOrders = propProductionOrders || [];

  const handleSkuClick = React.useCallback((sku: SKU) => {
    // 'productionOrders' here now refers to the local const which is guaranteed to be an array.
    const ordersForSku = productionOrders.filter(po => po.skuId === sku.id);
    setSelectedSkuDataForModal({ sku, productionOrders: ordersForSku });
    setIsSkuDetailsModalOpen(true);
  }, [productionOrders]); // Depends on the local, guaranteed-to-be-array 'productionOrders'

  const columns = React.useMemo(
    () => getDemandColumns(findSkuById, getProductionOrdersBySku, handleSkuClick),
    [findSkuById, getProductionOrdersBySku, handleSkuClick]
  );

  const sortedSkus = React.useMemo(() =>
    [...skus].sort((a, b) => a.code.localeCompare(b.code)),
  [skus]);

  const filteredData = React.useMemo(() => {
    if (skuFilter === "all") {
      return data;
    }
    return data.filter(demand => demand.skuId === skuFilter);
  }, [data, skuFilter]);

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
      deleteSelectedDemands(idsToDelete);
      toast({
        title: "Demandas Excluídas",
        description: `${idsToDelete.length} demanda(s) foram excluídas com sucesso.`,
      });
      table.resetRowSelection();
    } catch (error) {
      toast({
        title: "Erro ao Excluir",
        description: "Não foi possível excluir as demandas selecionadas.",
        variant: "destructive",
      });
    }
    setIsConfirmOpen(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <Select onValueChange={setSkuFilter} value={skuFilter}>
          <SelectTrigger className="w-full md:w-[280px] h-10">
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
        <div className="flex items-center space-x-2 self-end md:self-center">
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
                    Tem certeza que deseja excluir {selectedRows.length} demanda(s) selecionada(s)?
                    Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteSelected}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    Excluir {selectedRows.length} demanda(s)
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
          <DemandFormDialog />
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
                  Nenhuma demanda encontrada {skuFilter !== "all" ? `para o SKU selecionado` : ''}.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      {selectedSkuDataForModal && (
        <SkuProductionDetailsModal
          isOpen={isSkuDetailsModalOpen}
          onClose={() => {
            setIsSkuDetailsModalOpen(false);
            setSelectedSkuDataForModal(null);
          }}
          sku={selectedSkuDataForModal.sku}
          productionOrders={selectedSkuDataForModal.productionOrders}
        />
      )}
    </div>
  );
}
    
