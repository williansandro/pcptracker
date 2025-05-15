"use client";

import { MoreHorizontal, Edit, Trash2, PlayCircle, PauseCircle, CheckCircle2, XCircle } from "lucide-react"; // Adicionado XCircle para Cancelar
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PoFormDialog } from "./po-form-dialog";
import type { ProductionOrder, SKU } from "@/types";
import { useAppContext } from "@/contexts/app-context";
import { useToast } from "@/hooks/use-toast";
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
import React from "react";
import { AiAnalysisDialog } from "./ai-analysis-dialog";


interface PoActionsProps {
  productionOrder: ProductionOrder;
}

export function PoActions({ productionOrder }: PoActionsProps) {
  const { 
    deleteProductionOrder, 
    startProductionOrderTimer, 
    stopProductionOrderTimer,
    updateProductionOrder,
    getProductionOrdersBySku,
    findSkuById,
  } = useAppContext();
  const { toast } = useToast();
  const sku = findSkuById(productionOrder.skuId);

  const handleDelete = () => {
    try {
      deleteProductionOrder(productionOrder.id);
      toast({ title: "Ordem de Produção Excluída", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}) excluída.` });
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível excluir a OP.", variant: "destructive" });
    }
  };

  const handleStartTimer = () => {
    startProductionOrderTimer(productionOrder.id);
    toast({ title: "Produção Iniciada", description: `Timer iniciado para OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}).` });
  };

  const handleStopTimer = () => {
    stopProductionOrderTimer(productionOrder.id);
    toast({ title: "Produção Concluída", description: `Timer finalizado para OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}).` });
  };
  
  const handleCancelOrder = () => {
    updateProductionOrder(productionOrder.id, { status: 'Cancelada' });
    toast({ title: "Ordem Cancelada", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}) foi cancelada.` });
  };

  const completedOrdersForSku = sku ? getProductionOrdersBySku(sku.id).filter(po => po.status === 'Concluída') : [];

  return (
    <div className="flex items-center space-x-1">
      {productionOrder.status === 'Aberta' && (
        <Button variant="ghost" size="icon" onClick={handleStartTimer} title="Iniciar Produção">
          <PlayCircle className="h-5 w-5 text-green-600" />
        </Button>
      )}
      {productionOrder.status === 'Em Progresso' && (
        <Button variant="ghost" size="icon" onClick={handleStopTimer} title="Finalizar Produção">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
        </Button>
      )}

      <AlertDialog>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <PoFormDialog
              productionOrder={productionOrder}
              trigger={
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={productionOrder.status === 'Concluída' || productionOrder.status === 'Cancelada'}>
                  <Edit className="mr-2 h-4 w-4" /> Editar
                </DropdownMenuItem>
              }
            />
            {sku && completedOrdersForSku.length > 0 && (
               <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                 {/* A DialogTrigger está dentro do AiAnalysisDialog agora */}
                 <AiAnalysisDialog productionOrdersForSku={completedOrdersForSku} sku={sku}/>
               </DropdownMenuItem>
            )}
             {(productionOrder.status === 'Aberta' || productionOrder.status === 'Em Progresso') && (
              <DropdownMenuItem onClick={handleCancelOrder} className="text-orange-600 focus:text-orange-600 focus:bg-orange-500/10">
                <XCircle className="mr-2 h-4 w-4" /> Cancelar Ordem
              </DropdownMenuItem>
            )}
            <AlertDialogTrigger asChild>
              <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10">
                <Trash2 className="mr-2 h-4 w-4" /> Excluir
              </DropdownMenuItem>
            </AlertDialogTrigger>
          </DropdownMenuContent>
        </DropdownMenu>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta Ordem de Produção ({productionOrder.id.substring(0,8)} - {sku?.code || ''})? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
