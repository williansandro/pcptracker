
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
  DialogClose,
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
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import { useAppContext } from "@/contexts/app-context";
import type { ProductionOrder } from "@/types";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2 } from "lucide-react";

const completePoFormSchema = z.object({
  producedQuantity: z.coerce.number().min(0, "Quantidade produzida não pode ser negativa."),
  deductLunchBreak: z.boolean().optional().default(false), // Novo campo
});

type CompletePoFormValues = z.infer<typeof completePoFormSchema>;

interface CompletePoDialogProps {
  productionOrder: ProductionOrder;
  triggerButton?: React.ReactNode;
}

export function CompletePoDialog({ productionOrder, triggerButton }: CompletePoDialogProps) {
  const { stopProductionOrderTimer, findSkuById } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const sku = findSkuById(productionOrder.skuId);

  const form = useForm<CompletePoFormValues>({
    resolver: zodResolver(completePoFormSchema),
    defaultValues: {
      producedQuantity: productionOrder.targetQuantity,
      deductLunchBreak: false, // Valor padrão
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        producedQuantity: productionOrder.targetQuantity,
        deductLunchBreak: false,
      });
    }
  }, [open, form, productionOrder.targetQuantity]);

  const onSubmit = (data: CompletePoFormValues) => {
    try {
      stopProductionOrderTimer(productionOrder.id, data.producedQuantity, data.deductLunchBreak);
      toast({ title: "Produção Concluída", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}) finalizada com ${data.producedQuantity} unidades.` });
      setOpen(false);
      // form.reset(); // Reset já é feito no useEffect quando o dialog abre
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível finalizar a Ordem de Produção.", variant: "destructive" });
      console.error("Erro ao finalizar OP:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {triggerButton ? triggerButton : (
             <Button variant="ghost" size="icon" title="Finalizar Produção">
                <CheckCircle2 className="h-5 w-5 text-blue-400 hover:text-blue-500" />
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Finalizar Ordem de Produção</DialogTitle>
          <DialogDescription>
            Informe a quantidade produzida para a OP {productionOrder.id.substring(0,8)} ({sku?.code || ''}).
            Meta: {productionOrder.targetQuantity} unidades.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="producedQuantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade Realmente Produzida</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 95" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deductLunchBreak"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-3 shadow-sm bg-card-foreground/5">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="cursor-pointer">
                      Descontar pausa para almoço (60 min)?
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Confirmar Produção</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
