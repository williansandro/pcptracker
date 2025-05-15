
"use client";

import { MoreHorizontal, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SkuFormDialog } from "./sku-form-dialog";
import type { SKU } from "@/types";
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
} from "@/components/ui/alert-dialog"
import React from "react";


interface SkuActionsProps {
  sku: SKU;
}

export function SkuActions({ sku }: SkuActionsProps) {
  const { deleteSku } = useAppContext();
  const { toast } = useToast();

  const handleDelete = () => {
    try {
      deleteSku(sku.id); // Esta função agora lança um erro se houver dependências
      toast({ title: "SKU Excluído", description: `SKU ${sku.code} excluído com sucesso.` });
    } catch (error: any) {
      toast({ 
        title: "Erro ao Excluir SKU", 
        description: error.message || "Não foi possível excluir o SKU devido a dependências.", 
        variant: "destructive" 
      });
    }
  };

  return (
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
          <SkuFormDialog
            sku={sku}
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <Edit className="mr-2 h-4 w-4" /> Editar
              </DropdownMenuItem>
            }
          />
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
            Tem certeza que deseja excluir o SKU "{sku.code} - {sku.description}"? Esta ação não pode ser desfeita.
            Se o SKU estiver vinculado a Ordens de Produção ou Demandas, ele não poderá ser excluído.
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
  );
}

