
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { useAppContext } from "@/contexts/app-context";
import type { ProductionOrder, BreakEntry } from "@/types";
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card } from "@/components/ui/card";
import { v4 as uuidv4 } from 'uuid';

const breakEntrySchema = z.object({
  id: z.string().optional(), // ID será gerado ou virá do Firestore
  description: z.string().min(1, "Descrição da pausa é obrigatória."),
  durationMinutes: z.coerce.number().min(1, "Duração deve ser pelo menos 1 minuto."),
});

const completePoFormSchema = z.object({
  producedQuantity: z.coerce.number().min(0, "Quantidade produzida não pode ser negativa."),
  breaks: z.array(breakEntrySchema).optional().default([]),
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
      breaks: productionOrder.breaks?.map(b => ({...b, id: b.id || uuidv4()})) || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "breaks",
  });

  useEffect(() => {
    if (open) {
      form.reset({
        producedQuantity: productionOrder.targetQuantity,
        breaks: productionOrder.breaks?.map(b => ({...b, id: b.id || uuidv4()})) || [],
      });
    }
  }, [open, form, productionOrder]);

  const onSubmit = (data: CompletePoFormValues) => {
    try {
      const breaksWithIds: BreakEntry[] = (data.breaks || []).map(b => ({
        ...b,
        id: b.id || uuidv4(), 
      }));

      stopProductionOrderTimer(productionOrder.id, data.producedQuantity, breaksWithIds);
      toast({ title: "Produção Concluída", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}) finalizada com ${data.producedQuantity} unidades.` });
      setOpen(false);
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Finalizar Ordem de Produção</DialogTitle>
          <DialogDescription>
            Informe a quantidade produzida e as pausas para a OP {productionOrder.id.substring(0,8)} ({sku?.code || ''}).
            Meta: {productionOrder.targetQuantity} unidades.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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

              <div className="space-y-3">
                <FormLabel className="text-base font-medium">Pausas Registradas</FormLabel>
                {fields.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-2">Nenhuma pausa registrada.</p>
                )}
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-card-foreground/5 border-border">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                      <FormField
                        control={form.control}
                        name={`breaks.${index}.description`}
                        render={({ field: breakField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Descrição da Pausa</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Almoço, Manutenção" {...breakField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`breaks.${index}.durationMinutes`}
                        render={({ field: breakField }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Duração (min)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="Ex: 60" {...breakField} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => remove(index)}
                        className="md:self-end h-9 w-9"
                        title="Remover Pausa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => append({ id: uuidv4(), description: "", durationMinutes: 0 })}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Pausa
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">Cancelar</Button>
          </DialogClose>
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>Confirmar Produção</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
