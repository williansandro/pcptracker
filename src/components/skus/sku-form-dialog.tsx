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
import React, { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { PlusCircle, Edit } from "lucide-react";

const skuFormSchema = z.object({
  code: z.string().min(1, "Código é obrigatório").max(50, "Código muito longo"),
  description: z.string().min(1, "Descrição é obrigatória").max(255, "Descrição muito longa"),
});

type SkuFormValues = z.infer<typeof skuFormSchema>;

interface SkuFormDialogProps {
  sku?: SKU; // For editing
  trigger?: React.ReactNode;
}

export function SkuFormDialog({ sku, trigger }: SkuFormDialogProps) {
  const { addSku, updateSku } = useAppContext();
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<SkuFormValues>({
    resolver: zodResolver(skuFormSchema),
    defaultValues: sku ? { code: sku.code, description: sku.description } : { code: "", description: "" },
  });

  useEffect(() => {
    if (sku) {
      form.reset({ code: sku.code, description: sku.description });
    } else {
      form.reset({ code: "", description: "" });
    }
  }, [sku, form, open]);


  const onSubmit = (data: SkuFormValues) => {
    try {
      if (sku) {
        updateSku(sku.id, data);
        toast({ title: "SKU Atualizado", description: `SKU ${data.code} atualizado com sucesso.` });
      } else {
        addSku(data);
        toast({ title: "SKU Adicionado", description: `SKU ${data.code} adicionado com sucesso.` });
      }
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível salvar o SKU.", variant: "destructive" });
      console.error("Error saving SKU:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Adicionar SKU
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{sku ? "Editar SKU" : "Adicionar Novo SKU"}</DialogTitle>
          <DialogDescription>
            {sku ? "Atualize os detalhes do SKU." : "Preencha os detalhes para um novo SKU."}
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
                    <Input placeholder="Ex: COMP001-X" {...field} />
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
                    <Textarea placeholder="Descrição detalhada do SKU..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button type="submit">Salvar SKU</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
