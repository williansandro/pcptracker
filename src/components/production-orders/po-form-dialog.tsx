
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/app-context";
import type { ProductionOrder, ProductionOrderStatus } from "@/types";
import { PRODUCTION_ORDER_STATUSES } from "@/lib/constants";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";

const poFormSchema = z.object({
  skuId: z.string().min(1, "SKU é obrigatório."),
  targetQuantity: z.coerce.number().min(1, "Quantidade alvo deve ser pelo menos 1."),
  producedQuantity: z.coerce.number().min(0, "Quantidade produzida não pode ser negativa.").optional(),
  notes: z.string().optional(),
  status: z.custom<ProductionOrderStatus>((val) => PRODUCTION_ORDER_STATUSES.includes(val as ProductionOrderStatus), {
    message: "Status inválido."
  }).optional(),
});

type PoFormValues = z.infer<typeof poFormSchema>;

interface PoFormDialogProps {
  productionOrder?: ProductionOrder;
  trigger?: React.ReactNode;
}

export function PoFormDialog({ productionOrder, trigger }: PoFormDialogProps) {
  const { skus, addProductionOrder, updateProductionOrder, findSkuById, stopProductionOrderTimer } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getInitialValues = useCallback(() => {
    return productionOrder
    ? {
        skuId: productionOrder.skuId,
        targetQuantity: productionOrder.targetQuantity,
        producedQuantity: productionOrder.producedQuantity,
        notes: productionOrder.notes || "",
        status: productionOrder.status
      }
    : {
        skuId: "",
        targetQuantity: 1,
        notes: "",
        status: "Aberta" as ProductionOrderStatus
      };
  }, [productionOrder]);

  const form = useForm<PoFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues());
    }
  }, [productionOrder, form, open, getInitialValues]);


  const onSubmit = (data: PoFormValues) => {
    try {
      const sku = findSkuById(data.skuId);
      if (productionOrder) {
        // Se o status está sendo mudado para Concluída E producedQuantity não foi fornecido no form,
        // mas existe um productionOrder.producedQuantity (ex: de uma finalização anterior), usamos esse.
        // Se não, e ainda não foi fornecido, precisamos de um valor.
        // Para simplificar, se status é 'Concluída', producedQuantity deve ser definido.
        // A lógica de finalização com `stopProductionOrderTimer` no `CompletePoDialog` tratará do producedQuantity inicial.
        // Este form é mais para edição.
        let finalProducedQuantity = data.producedQuantity;
        if (data.status === 'Concluída' && typeof data.producedQuantity !== 'number' && typeof productionOrder.producedQuantity === 'number') {
            finalProducedQuantity = productionOrder.producedQuantity;
        } else if (data.status === 'Concluída' && typeof data.producedQuantity !== 'number') {
            // Caso o usuário mude para concluída aqui e não tenha vindo do CompletePoDialog
            // e não tenha preenchido o campo (que deveria ser obrigatório visualmente)
            // Poderíamos lançar um erro ou usar targetQuantity. Por ora, toast de erro.
            toast({title: "Erro", description: "Quantidade produzida é obrigatória ao concluir uma ordem.", variant: "destructive"});
            return;
        }


        updateProductionOrder(productionOrder.id, {
            skuId: data.skuId,
            targetQuantity: data.targetQuantity,
            producedQuantity: data.status === 'Concluída' ? finalProducedQuantity : undefined, // Só salva se concluída
            notes: data.notes,
            ...(data.status && { status: data.status })
        });
        toast({ title: "Ordem de Produção Atualizada", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code}) atualizada.` });
      } else {
        addProductionOrder({ skuId: data.skuId, targetQuantity: data.targetQuantity, notes: data.notes });
        toast({ title: "Ordem de Produção Adicionada", description: `Nova OP para ${sku?.code} adicionada.` });
      }
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a Ordem de Produção.", variant: "destructive" });
      console.error("Erro ao salvar OP:", error);
    }
  };

  const currentStatus = form.watch("status");
  const isEditingCompletedOrder = productionOrder?.status === 'Concluída';
  const isStatusChangingToCompleted = currentStatus === 'Concluída';


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Ordem de Produção
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{productionOrder ? "Editar Ordem de Produção" : "Criar Nova Ordem de Produção"}</DialogTitle>
          <DialogDescription>
            {productionOrder ? "Atualize os detalhes da OP." : "Preencha os detalhes para uma nova OP."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="skuId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>SKU</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value} disabled={!!productionOrder && productionOrder.status !== 'Aberta'}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um SKU" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {skus.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.code} - {s.description}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade Alvo</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} disabled={!!productionOrder && productionOrder.status !== 'Aberta'}/>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {productionOrder && (
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={productionOrder.status === 'Concluída' || productionOrder.status === 'Cancelada' || productionOrder.status === 'Em Progresso'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCTION_ORDER_STATUSES.map(s => (
                          <SelectItem key={s} value={s}
                           disabled={(s === 'Em Progresso' || s === 'Concluída') && productionOrder.status === 'Aberta' || (s === 'Aberta' && productionOrder.status !== 'Aberta')}
                          >
                            {s}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            {(isEditingCompletedOrder || (productionOrder && isStatusChangingToCompleted)) && (
               <FormField
                control={form.control}
                name="producedQuantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantidade Produzida</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Ex: 95" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações adicionais (opcional)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={productionOrder && (productionOrder.status === 'Concluída' || productionOrder.status === 'Cancelada') && !isStatusChangingToCompleted && !isEditingCompletedOrder}>Salvar Ordem</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
