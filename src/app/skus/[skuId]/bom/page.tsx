
"use client";

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/contexts/app-context';
import type { SKU, BOMEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, PlusCircle, Save, Trash2, Loader2, PackageSearch } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const bomEntrySchema = z.object({
  componentSkuId: z.string().min(1, "SKU do componente é obrigatório."),
  quantity: z.coerce.number().min(1, "Quantidade deve ser pelo menos 1."),
});

const bomFormSchema = z.object({
  components: z.array(bomEntrySchema).optional().default([]),
});

type BomFormValues = z.infer<typeof bomFormSchema>;

export default function SkuBomPage() {
  const params = useParams();
  const router = useRouter();
  const skuId = params.skuId as string;
  
  const { skus: allSkus, findSkuById, updateSku, isDataReady } = useAppContext();
  const { toast } = useToast();
  
  const [skuPai, setSkuPai] = useState<SKU | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<BomFormValues>({
    resolver: zodResolver(bomFormSchema),
    defaultValues: {
      components: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'components',
  });

  useEffect(() => {
    if (isDataReady && skuId) {
      const foundSku = findSkuById(skuId);
      setSkuPai(foundSku || null); // Define como null se não encontrado
      if (foundSku) {
        form.reset({ components: foundSku.components?.map(c => ({...c, quantity: Number(c.quantity) })) || [] });
      }
      setIsLoading(false);
    } else if (!isDataReady && skuId) {
      // Se os dados não estão prontos mas temos skuId, continuamos carregando
      setIsLoading(true);
    } else if (!skuId) {
      // Se não há skuId, definimos como não encontrado e paramos de carregar
      setSkuPai(null);
      setIsLoading(false);
    }
  }, [skuId, isDataReady, findSkuById, form]);

  const availableSkusForComponents = useMemo(() => {
    if (!skuPai) return [];
    return allSkus.filter(s => s.id !== skuPai.id).sort((a, b) => a.code.localeCompare(b.code));
  }, [allSkus, skuPai]);

  const onSubmit = async (data: BomFormValues) => {
    if (!skuPai) {
      toast({ title: "Erro", description: "SKU principal não encontrado.", variant: "destructive" });
      return;
    }
    setIsSaving(true);

    const processedComponents = data.components.map(c => ({
      componentSkuId: c.componentSkuId,
      quantity: Number(c.quantity) // Garantir que quantity seja um número
    }));

    const updatePayload = {
      components: processedComponents
    };
    
    console.log("[SkuBomPage] Attempting to save BOM. skuPai.id:", skuPai.id, "Payload:", JSON.stringify(updatePayload, null, 2));

    try {
      // Passando apenas o payload de componentes
      const success = await updateSku(skuPai.id, updatePayload as Partial<Omit<SKU, 'id' | 'createdAt'>>);
      if (success) {
        toast({
          title: 'Lista de Materiais Atualizada',
          description: `Componentes do SKU ${skuPai.code} salvos com sucesso.`,
        });
      } else {
        // O toast de erro já é exibido por updateSku
      }
    } catch (error) {
      console.error('Erro ao salvar lista de materiais na página BOM:', error);
      toast({
        title: 'Erro ao Salvar',
        description: 'Não foi possível salvar a lista de materiais.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Carregando dados do SKU...</p>
      </div>
    );
  }

  if (!skuPai) { 
    return (
      <div className="container mx-auto py-10 text-center">
        <PackageSearch className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-4">SKU Não Encontrado</h1>
        <p className="mb-6 text-muted-foreground">O SKU com o ID fornecido não foi encontrado.</p>
        <Button asChild variant="outline">
          <Link href="/skus">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para SKUs
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Lista de Materiais (BOM) para SKU: <span className="text-primary">{skuPai.code}</span>
          </h1>
          <p className="text-muted-foreground">{skuPai.description}</p>
        </div>
        <Button asChild variant="outline">
          <Link href="/skus">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para SKUs
          </Link>
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Componentes</CardTitle>
              <CardDescription>Adicione ou remova os SKUs que compõem este produto e suas respectivas quantidades.</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="max-h-[50vh] pr-3">
                <div className="space-y-4">
                  {fields.length === 0 && (
                    <p className="text-sm text-center text-muted-foreground py-4">
                      Nenhum componente adicionado a este SKU.
                    </p>
                  )}
                  {fields.map((item, index) => (
                    <Card key={item.id} className="p-4 bg-card-foreground/5 border-border">
                      <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_auto] gap-4 items-end">
                        <FormField
                          control={form.control}
                          name={`components.${index}.componentSkuId`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs">Componente SKU</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value || ""}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecione um componente" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableSkusForComponents.map(s => (
                                    <SelectItem key={s.id} value={s.id}>
                                      {s.code} - {s.description}
                                    </SelectItem>
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
                                <Input type="number" placeholder="1" {...field} 
                                  onChange={e => field.onChange(parseInt(e.target.value,10) || 1)} 
                                  value={field.value || 1} />
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
                          className="h-9 w-9"
                          title="Remover Componente"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => append({ componentSkuId: "", quantity: 1 })}
                className="mt-6"
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Componente
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-end space-x-3 mt-8">
            <Button type="button" variant="outline" onClick={() => router.push('/skus')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSaving || isLoading || !skuPai}>
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Salvar Lista de Materiais
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

    