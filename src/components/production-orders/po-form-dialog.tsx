
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
import { Checkbox } from "@/components/ui/checkbox"; // Importar Checkbox
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/app-context";
import type { ProductionOrder, ProductionOrderStatus } from "@/types";
import { PRODUCTION_ORDER_STATUSES } from "@/lib/constants";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { format, parseISO, isValid } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";

const poFormSchema = z.object({
  skuId: z.string().min(1, "SKU é obrigatório."),
  targetQuantity: z.coerce.number().min(1, "Quantidade alvo deve ser pelo menos 1."),
  notes: z.string().optional(),
  status: z.custom<ProductionOrderStatus>((val) => PRODUCTION_ORDER_STATUSES.includes(val as ProductionOrderStatus)).optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  producedQuantity: z.coerce.number().optional(),
  deductLunchBreak: z.boolean().optional().default(false), // Novo campo
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
        deductLunchBreak: false, // Inicializa como falso, usuário pode marcar se quiser recalcular
      }
    : {
        skuId: "",
        targetQuantity: 1,
        notes: "",
        status: "Aberta" as ProductionOrderStatus,
        startTime: "",
        endTime: "",
        producedQuantity: undefined,
        deductLunchBreak: false,
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
        const updatePayload: Partial<Omit<ProductionOrder, 'id' | 'createdAt'>> = {
          skuId: data.skuId,
          targetQuantity: data.targetQuantity,
          notes: data.notes,
          status: data.status, // Manter o status atual, a menos que seja explicitamente alterado
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
              if (data.deductLunchBreak) { // Aplica dedução se checkbox estiver marcado
                calculatedProductionTime -= 3600;
              }
              updatePayload.productionTime = calculatedProductionTime;
            } else {
              updatePayload.productionTime = null; // Erro de data, tempo inválido
            }
          } else {
             updatePayload.productionTime = null;
          }
        }


        updateProductionOrder(productionOrder.id, updatePayload);
        toast({ title: "Ordem de Produção Atualizada", description: `OP ${productionOrder.id.substring(0,8)} (${sku?.code || ''}) atualizada.` });

      } else {
        addProductionOrder({ skuId: data.skuId, targetQuantity: data.targetQuantity, notes: data.notes });
        toast({ title: "Ordem de Produção Adicionada", description: `Nova OP para ${sku?.code || ''} adicionada.` });
      }
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a Ordem de Produção.", variant: "destructive" });
      console.error("Erro ao salvar OP:", error);
    }
  };

  const currentPoStatusForEdit = productionOrder?.status;

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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{productionOrder ? "Editar Ordem de Produção" : "Criar Nova Ordem de Produção"}</DialogTitle>
          <DialogDescription>
            {productionOrder ? "Atualize os detalhes da OP." : "Preencha os detalhes para uma nova OP."}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[65vh] pr-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
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
                          <SelectItem key={s.id} value={s.id}>{s.code}</SelectItem>
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
                         {/* O status não é diretamente editável aqui; é alterado por ações específicas */}
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
                            value={field.value ?? ''} // Garante que o valor seja sempre string ou number
                            onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value, 10))}
                          />
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
                </>
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
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter>
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

    