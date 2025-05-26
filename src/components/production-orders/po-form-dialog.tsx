
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
import type { ProductionOrder, ProductionOrderStatus, BreakEntry } from "@/types";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react"; 
import { format, parseISO, isValid } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { v4 as uuidv4 } from 'uuid';
import { Card } from "@/components/ui/card"; 

const breakEntrySchemaEdit = z.object({
  id: z.string().optional(), // Opcional, pois pode ser uma nova pausa ou uma existente
  description: z.string().min(1, "Descrição da pausa é obrigatória."),
  durationMinutes: z.coerce.number().min(1, "Duração deve ser pelo menos 1 minuto."),
});

const poFormSchema = z.object({
  skuId: z.string().min(1, "SKU é obrigatório."),
  targetQuantity: z.coerce.number().min(1, "Quantidade alvo deve ser pelo menos 1."),
  notes: z.string().optional(),
  status: z.custom<ProductionOrderStatus>((val) => ['Aberta', 'Em Progresso', 'Concluída', 'Cancelada'].includes(val as ProductionOrderStatus)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  producedQuantity: z.coerce.number().optional(),
  breaks: z.array(breakEntrySchemaEdit).optional().default([]),
})
.superRefine((data, ctx) => {
  const currentStatus = data.status;

  if (currentStatus === 'Concluída') {
    if (!data.startTime || !isValid(parseISO(data.startTime))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de início é obrigatória e válida.", path: ['startTime'] });
    }
    if (!data.endTime || !isValid(parseISO(data.endTime))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de término é obrigatória e válida.", path: ['endTime'] });
    }
    if (data.startTime && data.endTime && isValid(parseISO(data.startTime)) && isValid(parseISO(data.endTime)) && new Date(data.endTime) < new Date(data.startTime)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de término deve ser igual ou após a data de início.", path: ['endTime'] });
    }
    if (typeof data.producedQuantity !== 'number' || data.producedQuantity < 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Quantidade produzida é obrigatória e não pode ser negativa.", path: ['producedQuantity'] });
    }
  }
  if (currentStatus === 'Em Progresso') {
    if (!data.startTime || !isValid(parseISO(data.startTime))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Data de início é obrigatória e válida.", path: ['startTime'] });
    }
  }
});

type PoFormValues = z.infer<typeof poFormSchema>;

interface PoFormDialogProps {
  productionOrder?: ProductionOrder;
  trigger?: React.ReactNode;
}

const formatIsoToDateTimeLocal = (isoString: string | undefined | null): string => {
  if (!isoString) return "";
  try {
    const date = parseISO(isoString);
    if (isValid(date)) {
      return format(date, "yyyy-MM-dd'T'HH:mm");
    }
    return "";
  } catch (error) {
    console.warn("Erro ao formatar data para datetime-local:", isoString, error);
    return "";
  }
};


export function PoFormDialog({ productionOrder, trigger }: PoFormDialogProps) {
  const { skus, addProductionOrder, updateProductionOrder, findSkuById } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getInitialValues = useCallback((): PoFormValues => {
    return productionOrder
    ? {
        skuId: productionOrder.skuId,
        targetQuantity: productionOrder.targetQuantity,
        producedQuantity: productionOrder.producedQuantity ?? undefined,
        notes: productionOrder.notes || "",
        status: productionOrder.status,
        startTime: formatIsoToDateTimeLocal(productionOrder.startTime),
        endTime: formatIsoToDateTimeLocal(productionOrder.endTime),
        breaks: productionOrder.breaks?.map(b => ({...b, id: b.id || uuidv4()})) || [],
      }
    : {
        skuId: "",
        targetQuantity: 1,
        notes: "",
        status: "Aberta" as ProductionOrderStatus,
        startTime: "",
        endTime: "",
        producedQuantity: undefined,
        breaks: [],
      };
  }, [productionOrder]);

  const form = useForm<PoFormValues>({
    resolver: zodResolver(poFormSchema),
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "breaks",
  });

  useEffect(() => {
    if (open) {
      form.reset(getInitialValues());
    }
  }, [productionOrder, form, open, getInitialValues]);


  const onSubmit = (data: PoFormValues) => {
    try {
      const sku = findSkuById(data.skuId);
      const breaksWithIds: BreakEntry[] = (data.breaks || []).map(b => ({
        ...b,
        id: b.id || uuidv4(),
      }));

      if (productionOrder) {
        const updatePayload: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>> = {
          skuId: data.skuId,
          targetQuantity: data.targetQuantity,
          notes: data.notes,
          status: data.status,
          breaks: breaksWithIds, 
        };

        if (data.status === 'Em Progresso') {
          updatePayload.startTime = data.startTime && isValid(parseISO(data.startTime)) ? new Date(data.startTime).toISOString() : null;
          updatePayload.endTime = null;
          updatePayload.productionTime = null;
          updatePayload.producedQuantity = undefined;
        } else if (data.status === 'Concluída') {
          updatePayload.startTime = data.startTime && isValid(parseISO(data.startTime)) ? new Date(data.startTime).toISOString() : null;
          updatePayload.endTime = data.endTime && isValid(parseISO(data.endTime)) ? new Date(data.endTime).toISOString() : null;
          updatePayload.producedQuantity = data.producedQuantity;

          if (updatePayload.startTime && updatePayload.endTime) {
            const startTimeMs = new Date(updatePayload.startTime).getTime();
            const endTimeMs = new Date(updatePayload.endTime).getTime();
            if (endTimeMs >= startTimeMs) {
              let calculatedProductionTime = Math.floor((endTimeMs - startTimeMs) / 1000);
              const totalBreaksDurationSeconds = (breaksWithIds).reduce((acc, itemBreak) => acc + (itemBreak.durationMinutes * 60), 0);
              calculatedProductionTime -= totalBreaksDurationSeconds;
              updatePayload.productionTime = calculatedProductionTime;
            } else {
              updatePayload.productionTime = null;
            }
          } else {
             updatePayload.productionTime = null;
          }
        }

        updateProductionOrder(productionOrder.id, updatePayload);
        toast({ title: "Ordem de Produção Atualizada", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}) atualizada.` });

      } else {
        addProductionOrder({ 
            skuId: data.skuId, 
            targetQuantity: data.targetQuantity, 
            notes: data.notes,
            breaks: [] 
        });
        toast({ title: "Ordem de Produção Adicionada", description: `Nova OP para ${sku?.code || ''} adicionada.` });
      }
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a Ordem de Produção.", variant: "destructive" });
      console.error("Erro ao salvar OP:", error);
    }
  };

  const currentPoStatusForEdit = form.watch("status"); 

  const sortedSkus = React.useMemo(() =>
    [...skus].sort((a, b) => a.code.localeCompare(b.code)),
  [skus]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Criar Ordem de Produção
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{productionOrder ? "Editar Ordem de Produção" : "Criar Nova Ordem de Produção"}</DialogTitle>
          <DialogDescription>
            {productionOrder ? "Atualize os detalhes da OP." : "Preencha os detalhes para uma nova OP."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 pr-2">
              <FormField
                control={form.control}
                name="skuId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value}
                      disabled={!!productionOrder && currentPoStatusForEdit !== 'Aberta'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um SKU" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {sortedSkus.map(s => (
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
                      <Input
                        type="number"
                        placeholder="100"
                        {...field}
                        disabled={!!productionOrder && currentPoStatusForEdit !== 'Aberta'}
                      />
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
                      <FormControl>
                         <Input {...field} readOnly disabled className="bg-muted/50 cursor-not-allowed" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}


              {productionOrder && (currentPoStatusForEdit === 'Em Progresso' || currentPoStatusForEdit === 'Concluída') && (
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Início</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {productionOrder && currentPoStatusForEdit === 'Concluída' && (
                <>
                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Data de Término</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} value={field.value || ''} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="producedQuantity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quantidade Produzida</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="Ex: 95"
                            {...field}
                            value={field.value ?? ''}
                            onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}

              {productionOrder && (currentPoStatusForEdit === 'Em Progresso' || currentPoStatusForEdit === 'Concluída') && (
                <div className="space-y-3 pt-2">
                  <FormLabel className="text-base font-medium">Gerenciar Pausas</FormLabel>
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
                                <Input placeholder="Ex: Almoço, Café" {...breakField} />
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
                          size="icon"
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
              )}


              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Observações adicionais (opcional)" {...field} value={field.value ?? ''}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button
            type="button"
            onClick={form.handleSubmit(onSubmit)}
            disabled={currentPoStatusForEdit === 'Cancelada'}
          >
            Salvar Ordem
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
