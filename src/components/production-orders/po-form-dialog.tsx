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
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit } from "lucide-react";

const poFormSchema = z.object({
  skuId: z.string().min(1, "SKU é obrigatório."),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1."),
  notes: z.string().optional(),
  // Status, startTime, endTime, productionTime are handled by actions or context logic mostly
  status: z.custom<ProductionOrderStatus>((val) => PRODUCTION_ORDER_STATUSES.includes(val as ProductionOrderStatus)).optional(),
});

type PoFormValues = z.infer<typeof poFormSchema>;

interface PoFormDialogProps {
  productionOrder?: ProductionOrder;
  trigger?: React.ReactNode;
}

export function PoFormDialog({ productionOrder, trigger }: PoFormDialogProps) {
  const { skus, addProductionOrder, updateProductionOrder } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const defaultValues = productionOrder 
    ? { skuId: productionOrder.skuId, quantity: productionOrder.quantity, notes: productionOrder.notes || "", status: productionOrder.status }
    : { skuId: "", quantity: 1, notes: "", status: "Open" as ProductionOrderStatus };

  const form = useForm<PoFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues,
  });
  
  useEffect(() => {
    if (productionOrder) {
      form.reset({ 
        skuId: productionOrder.skuId, 
        quantity: productionOrder.quantity, 
        notes: productionOrder.notes || "",
        status: productionOrder.status,
       });
    } else {
      form.reset({ skuId: "", quantity: 1, notes: "", status: "Open" });
    }
  }, [productionOrder, form, open]);


  const onSubmit = (data: PoFormValues) => {
    try {
      if (productionOrder) {
        // For updates, we might want to separate status changes
        // For now, only basic fields are editable here
        updateProductionOrder(productionOrder.id, { 
            skuId: data.skuId, 
            quantity: data.quantity, 
            notes: data.notes,
            ...(data.status && { status: data.status }) // Only update status if provided in form
        });
        toast({ title: "Ordem de Produção Atualizada", description: `OP atualizada com sucesso.` });
      } else {
        addProductionOrder({ skuId: data.skuId, quantity: data.quantity, notes: data.notes });
        toast({ title: "Ordem de Produção Adicionada", description: `Nova OP adicionada com sucesso.` });
      }
      setOpen(false);
      form.reset(defaultValues);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a Ordem de Produção.", variant: "destructive" });
      console.error("Error saving PO:", error);
    }
  };

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
                  <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
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
              name="quantity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Quantidade</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             {productionOrder && ( // Only show status field when editing
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRODUCTION_ORDER_STATUSES.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
              <Button type="submit">Salvar Ordem</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
