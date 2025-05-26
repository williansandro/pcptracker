
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
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
import React from "react";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const skuInlineFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório.").max(50, "Código não pode exceder 50 caracteres."),
  description: z.string().min(1, "Descrição é obrigatória.").max(255, "Descrição não pode exceder 255 caracteres."),
  standardTimeSeconds: z.coerce.number().min(0, "Tempo padrão não pode ser negativo.").optional(),
  assemblyTimeSeconds: z.coerce.number().min(0, "Tempo de montagem não pode ser negativo.").optional(),
});

type SkuInlineFormValues = z.infer<typeof skuInlineFormSchema>;

export function SkuInlineForm() {
  const { addSku } = useAppContext();

  const form = useForm<SkuInlineFormValues>({
    resolver: zodResolver(skuInlineFormSchema),
    defaultValues: {
      code: "",
      description: "",
      standardTimeSeconds: 0,
      assemblyTimeSeconds: 0,
    },
  });

  const onSubmit = async (data: SkuInlineFormValues) => {
    const skuDataPayload = {
      code: data.code.toUpperCase(),
      description: data.description,
      standardTimeSeconds: data.standardTimeSeconds || 0, // Salva 0 se undefined
      assemblyTimeSeconds: data.assemblyTimeSeconds || 0, // Salva 0 se undefined
      components: [], // Inicialmente sem componentes, gerenciado em outro lugar
    };
    const success = await addSku(skuDataPayload);
    if (success) {
      form.reset(); 
    }
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Adicionar Novo SKU</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-5 md:items-end">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: SKU001"
                      {...field}
                      onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      value={field.value ?? ''}
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
                <FormItem className="md:col-span-1">
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Input placeholder="Descrição do SKU" {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="standardTimeSeconds"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Tempo Padrão (seg)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 60" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="assemblyTimeSeconds"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Tempo Montagem (seg)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Ex: 30" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="md:col-span-1 h-10 self-start md:self-end mt-4 md:mt-0" disabled={form.formState.isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Adicionando..." : "Adicionar SKU"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
