
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAppContext } from "@/contexts/app-context";
import type { Demand } from "@/types";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { format } from 'date-fns';

const demandFormSchema = z.object({
  skuId: z.string().min(1, "SKU é obrigatório."),
  monthYear: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato de Mês/Ano inválido (AAAA-MM). Ex: 2024-07").min(7, "Mês/Ano é obrigatório."),
  targetQuantity: z.coerce.number().min(1, "Quantidade alvo deve ser pelo menos 1."),
});

type DemandFormValues = z.infer<typeof demandFormSchema>;

interface DemandFormDialogProps {
  demand?: Demand;
  trigger?: React.ReactNode;
}

export function DemandFormDialog({ demand, trigger }: DemandFormDialogProps) {
  const { skus, addDemand, updateDemand, findDemandBySkuAndMonth, findSkuById } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  
  const getInitialFormValues = useCallback(() => {
    const currentMonthYear = format(new Date(), 'yyyy-MM');
    return demand
      ? { skuId: demand.skuId, monthYear: demand.monthYear, targetQuantity: demand.targetQuantity }
      : { skuId: "", monthYear: currentMonthYear, targetQuantity: 100 };
  }, [demand]);

  const form = useForm<DemandFormValues>({
    resolver: zodResolver(demandFormSchema),
    defaultValues: getInitialFormValues(),
  });

  useEffect(() => {
    if (open) {
      form.reset(getInitialFormValues());
    }
  }, [demand, open, form, getInitialFormValues]);

  const onSubmit = (data: DemandFormValues) => {
    try {
      const existingDemandForMonth = findDemandBySkuAndMonth(data.skuId, data.monthYear);
      const sku = findSkuById(data.skuId);
      if (existingDemandForMonth && (!demand || existingDemandForMonth.id !== demand.id)) {
        toast({ title: "Demanda Duplicada", description: `Já existe uma demanda para o SKU ${sku?.code || ''} no mês ${data.monthYear}.`, variant: "destructive" });
        return;
      }

      if (demand) {
        updateDemand(demand.id, data);
        toast({ title: "Demanda Atualizada", description: `Demanda para ${sku?.code || ''} de ${data.monthYear} atualizada.` });
      } else {
        addDemand(data);
        toast({ title: "Demanda Adicionada", description: `Demanda para ${sku?.code || ''} de ${data.monthYear} adicionada.` });
      }
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar a Demanda.", variant: "destructive" });
      console.error("Error saving Demand:", error);
    }
  };

  const sortedSkus = React.useMemo(() =>
    [...skus].sort((a, b) => a.code.localeCompare(b.code)),
  [skus]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Demanda
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{demand ? "Editar Demanda Mensal" : "Adicionar Nova Demanda Mensal"}</DialogTitle>
          <DialogDescription>
            {demand ? "Atualize os detalhes da demanda." : "Preencha os detalhes para uma nova demanda."}
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
              name="monthYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mês/Ano (AAAA-MM)</FormLabel>
                  <FormControl>
                    <Input type="month" {...field} />
                  </FormControl>
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
                    <Input type="number" placeholder="100" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Demanda</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
