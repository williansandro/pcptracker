
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
      // A verificação de duplicidade de código ao editar não é trivial
      // se permitir a alteração do código. Por ora, mantemos o código não editável
      // ou assumimos que a alteração de código não pode colidir com outros existentes.
      // O AppContext não tem validação de duplicidade no updateSku atualmente.
      updateSku(sku.id, data);
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar SKU</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do SKU. O código não pode ser alterado após a criação.
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
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      value={field.value ?? ''}
                      readOnly // Código não é editável após a criação
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
