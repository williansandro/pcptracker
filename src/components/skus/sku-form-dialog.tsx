
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
import { useAppContext } from "@/contexts/app-context";
import type { SKU } from "@/types";
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";

const skuFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").max(50, "Código não pode exceder 50 caracteres."),
  description: z.string().min(1, "Descrição é obrigatória.").max(255, "Descrição não pode exceder 255 caracteres."),
  standardTimeSeconds: z.coerce.number().min(0, "Tempo padrão não pode ser negativo.").optional(),
  assemblyTimeSeconds: z.coerce.number().min(0, "Tempo de montagem não pode ser negativo.").optional(),
  // components: z.array(z.object(...)) // UI para BOM será adicionada depois
});

type SkuFormValues = z.infer<typeof skuFormSchema>;

interface SkuFormDialogProps {
  sku: SKU;
  trigger: React.ReactNode;
}

export function SkuFormDialog({ sku, trigger }: SkuFormDialogProps) {
  const { updateSku } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getInitialValues = useCallback(() => {
    return {
      code: sku?.code || "",
      description: sku?.description || "",
      standardTimeSeconds: sku?.standardTimeSeconds || 0,
      assemblyTimeSeconds: sku?.assemblyTimeSeconds || 0,
      // components: sku?.components || [],
    };
  }, [sku]);

  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema),
    defaultValues: getInitialValues(),
  });

  useEffect(() => {
    if (open && sku) {
      form.reset(getInitialValues());
    }
  }, [sku, form, open, getInitialValues]);

  const onSubmit = (data: SkuFormValues) => {
    if (!sku) return;
    try {
      const updatePayload = {
        ...data,
        standardTimeSeconds: data.standardTimeSeconds || 0,
        assemblyTimeSeconds: data.assemblyTimeSeconds || 0,
        // components: data.components || [], // Manter componentes existentes
      };
      updateSku(sku.id, updatePayload);
      toast({ title: "SKU Atualizado", description: `SKU ${data.code} atualizado com sucesso.` });
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro ao Atualizar", description: "Não foi possível salvar as alterações do SKU.", variant: "destructive" });
      console.error("Erro ao atualizar SKU:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Editar SKU</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do SKU. O código não pode ser alterado.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código do SKU</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: PROD001-AZ"
                      {...field}
                      value={field.value ?? ''}
                      readOnly
                      className="bg-muted/50 cursor-not-allowed"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Descrição detalhada do SKU..." {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="standardTimeSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo Padrão (seg/unid)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 60" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} value={field.value ?? 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assemblyTimeSeconds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tempo de Montagem (seg/unid)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} value={field.value ?? 0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Futuramente, aqui virá a UI para gerenciar os componentes da BOM */}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
