
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
import { useAppContext } from "@/contexts/app-context";
import type { SKU, BOMEntry } from "@/types";
import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const bomEntrySchema = z.object({
  componentSkuId: z.string().min(1, "SKU do componente é obrigatório."),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1."),
});

const skuFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório.").max(50, "Código não pode exceder 50 caracteres."),
  description: z.string().min(1, "Descrição é obrigatória.").max(255, "Descrição não pode exceder 255 caracteres."),
  standardTimeSeconds: z.coerce.number().min(0, "Tempo padrão não pode ser negativo.").optional(),
  assemblyTimeSeconds: z.coerce.number().min(0, "Tempo de montagem não pode ser negativo.").optional(),
  components: z.array(bomEntrySchema).optional().default([]),
});

type SkuFormValues = z.infer<typeof skuFormSchema>;

interface SkuFormDialogProps {
  sku: SKU; // Modal é apenas para edição, então SKU é obrigatório
  trigger: React.ReactNode;
}

export function SkuFormDialog({ sku, trigger }: SkuFormDialogProps) {
  const { skus: allSkus, updateSku } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const getInitialValues = useCallback((): SkuFormValues => {
    return {
      code: sku?.code || "",
      description: sku?.description || "",
      standardTimeSeconds: sku?.standardTimeSeconds || 0,
      assemblyTimeSeconds: sku?.assemblyTimeSeconds || 0,
      components: sku?.components?.map(c => ({ ...c })) || [],
    };
  }, [sku]);

  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema),
    defaultValues: getInitialValues(),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "components",
  });

  useEffect(() => {
    if (open && sku) {
      form.reset(getInitialValues());
    }
  }, [sku, form, open, getInitialValues]);

  const onSubmit = (data: SkuFormValues) => {
    if (!sku) return; // Double check, though 'sku' prop is mandatory
    try {
      const updatePayload: Partial<Omit<SKU, 'id' | 'createdAt'>> = {
        ...data,
        standardTimeSeconds: data.standardTimeSeconds || 0,
        assemblyTimeSeconds: data.assemblyTimeSeconds || 0,
        components: data.components || [],
      };
      updateSku(sku.id, updatePayload);
      toast({ title: "SKU Atualizado", description: `SKU ${data.code} atualizado com sucesso.` });
      setOpen(false);
    } catch (error) {
      toast({ title: "Erro ao Atualizar", description: "Não foi possível salvar as alterações do SKU.", variant: "destructive" });
      console.error("Erro ao atualizar SKU:", error);
    }
  };

  const availableSkusForComponents = useMemo(() => {
    return allSkus.filter(s => s.id !== sku?.id).sort((a,b) => a.code.localeCompare(b.code));
  }, [allSkus, sku]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar SKU</DialogTitle>
          <DialogDescription>
            Atualize os detalhes do SKU. O código não pode ser alterado.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[70vh] pr-4 -mr-4 pl-1"> {/* Ajuste de padding para ScrollArea */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4 pr-2"> {/* Adicionado pr-2 para não cortar o foco */}
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

              {/* Seção de Componentes (Lista de Materiais) */}
              <div className="space-y-4 pt-4">
                <FormLabel className="text-base font-medium text-foreground">Componentes (Lista de Materiais)</FormLabel>
                {fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">Nenhum componente adicionado.</p>
                )}
                {fields.map((item, index) => (
                  <Card key={item.id} className="p-3 bg-card-foreground/5 border-border">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3 items-end">
                      <FormField
                        control={form.control}
                        name={`components.${index}.componentSkuId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Componente SKU</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione um componente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableSkusForComponents.map(s => (
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
                        name={`components.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Quantidade</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 1)} />
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
                        title="Remover Componente"
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
                  onClick={() => append({ componentSkuId: "", quantity: 1 })}
                  className="mt-2"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Componente
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button type="submit" onClick={form.handleSubmit(onSubmit)}>Salvar Alterações</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
