
"use client";

import { MoreHorizontal, Edit, Trash2, ListTree, PackageSearch } from "lucide-react"; // Adicionado PackageSearch
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
} from "@/components/ui/alert-dialog" // AlertDialogTrigger removido daqui pois é usado como child
import React from "react";
import Link from "next/link";


interface SkuActionsProps {
  sku: SKU;
}

export function SkuActions({ sku }: SkuActionsProps) {
  const { deleteSku } = useAppContext();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteSku(sku.id); 
    } catch (error: any) {
      console.error("Falha ao excluir SKU (pego em SkuActions):", error.message);
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
                <Edit className="mr-2 h-4 w-4" /> Editar Detalhes
              </DropdownMenuItem>
            }
          />
          <DropdownMenuItem asChild>
            <Link href={`/skus/${sku.id}/bom`} className="flex items-center w-full">
              <ListTree className="mr-2 h-4 w-4" /> Gerenciar Componentes (BOM)
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/skus/${sku.id}/estrutura`} className="flex items-center w-full">
              <PackageSearch className="mr-2 h-4 w-4" /> Ver Estrutura
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
          <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
