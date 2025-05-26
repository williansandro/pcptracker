
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
import type { SKU } from "@/types"; // BOMEntry não é mais gerenciado aqui
import React, { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
// PlusCircle, Trash2 não são mais usados aqui
import { ScrollArea } from "@/components/ui/scroll-area";
// Card, Select, etc. relacionados a componentes não são mais usados aqui

// Schema simplificado, sem 'components'
const skuFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório.").max(50, "Código não pode exceder 50 caracteres."),
  description: z.string().min(1, "Descrição é obrigatória.").max(255, "Descrição não pode exceder 255 caracteres."),
  standardTimeSeconds: z.coerce.number().min(0, "Tempo padrão não pode ser negativo.").optional(),
  assemblyTimeSeconds: z.coerce.number().min(0, "Tempo de montagem não pode ser negativo.").optional(),
});

type SkuFormValues = z.infer<typeof skuFormSchema>;

interface SkuFormDialogProps {
  sku: SKU; 
  trigger: React.ReactNode;
}

export function SkuFormDialog({ sku, trigger }: SkuFormDialogProps) {
  const { updateSku } = useAppContext(); // allSkus não é mais necessário aqui
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getInitialValues = useCallback((): SkuFormValues => {
    return {
      code: sku?.code || "",
      description: sku?.description || "",
      standardTimeSeconds: sku?.standardTimeSeconds || 0,
      assemblyTimeSeconds: sku?.assemblyTimeSeconds || 0,
      // 'components' removido daqui
    };
  }, [sku]);

  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema),
    defaultValues: getInitialValues(),
  });

  // useFieldArray para 'components' foi removido

  useEffect(() => {
    if (open && sku) {
      form.reset(getInitialValues());
    }
  }, [sku, form, open, getInitialValues]);

  const onSubmit = async (data: SkuFormValues) => {
    if (!sku) return; 
    try {
      // Payload não inclui mais 'components' explicitamente aqui,
      // a menos que updateSku espere. updateSku agora lida com atualizações parciais.
      const updatePayload: Partial<Omit<SKU, 'id' | 'createdAt' | 'components'>> = {
        code: data.code, // Código não é editável, mas está no formulário
        description: data.description,
        standardTimeSeconds: data.standardTimeSeconds || 0,
        assemblyTimeSeconds: data.assemblyTimeSeconds || 0,
      };
      const success = await updateSku(sku.id, updatePayload);
      if (success) {
        toast({ title: "SKU Atualizado", description: `SKU ${data.code} atualizado com sucesso.` });
        setOpen(false);
      }
      // Se updateSku retornar false, o toast de erro já é exibido pelo AppContext
    } catch (error) { // Este catch é para erros inesperados não tratados por updateSku
      toast({ title: "Erro ao Atualizar", description: "Não foi possível salvar as alterações do SKU.", variant: "destructive" });
      console.error("Erro ao atualizar SKU:", error);
    }
  };

  // availableSkusForComponents foi removido

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar SKU</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do SKU. A Lista de Materiais é gerenciada em uma página dedicada.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 -mr-4 pl-1"> 
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 pr-2"> 
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
                        readOnly // Código não é editável
                        className="bg-muted/50 cursor-not-allowed"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
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
              {/* Seção de Componentes (Lista de Materiais) foi removida daqui */}
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="button" onClick={form.handleSubmit(onSubmit)}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
