
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
import { useToast } from "@/hooks/use-toast";
import { PlusCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const skuInlineFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório.").max(50, "Código não pode exceder 50 caracteres."),
  description: z.string().min(1, "Descrição é obrigatória.").max(255, "Descrição não pode exceder 255 caracteres."),
});

type SkuInlineFormValues = z.infer<typeof skuInlineFormSchema>;

export function SkuInlineForm() {
  const { addSku } = useAppContext();
  const { toast } = useToast();

  const form = useForm<SkuInlineFormValues>({
    resolver: zodResolver(skuInlineFormSchema),
    defaultValues: {
      code: "",
      description: "",
    },
  });

  const onSubmit = async (data: SkuInlineFormValues) => {
    try {
      await addSku(data);
      toast({ title: "SKU Adicionado", description: `SKU ${data.code} adicionado com sucesso.` });
      form.reset(); 
    } catch (error: any) {
      console.error("Erro ao adicionar SKU (formulário inline):", error);
      // O toast de erro já é tratado no AppContext, mas podemos adicionar um específico aqui se necessário.
      // Se addSku relançar o erro, podemos até evitar o toast aqui para não duplicar.
      // Por enquanto, o relançamento do erro no addSku e o toast lá parecem suficientes.
    }
  };

  return (
    <Card className="mb-6 shadow-md">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Adicionar Novo SKU</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 gap-4 md:grid-cols-3 md:items-end">
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem className="md:col-span-1">
                  <FormLabel>Código</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex: SKU001" {...field} value={field.value ?? ''} />
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
            <Button type="submit" className="md:col-span-1 h-10 self-end" disabled={form.formState.isSubmitting}>
              <PlusCircle className="mr-2 h-4 w-4" />
              {form.formState.isSubmitting ? "Adicionando..." : "Adicionar SKU"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
