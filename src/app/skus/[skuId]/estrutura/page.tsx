
"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAppContext } from '@/contexts/app-context';
import type { SKU, BOMEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Loader2, PackageSearch, Settings2 } from 'lucide-react'; // Ícone Settings2 para BOM
import Link from 'next/link';

interface EnrichedBOMEntry extends BOMEntry {
  componentCode?: string;
  componentDescription?: string;
}

export default function SkuStructurePage() {
  const params = useParams();
  const router = useRouter();
  const skuId = params.skuId as string;

  const { findSkuById, isDataReady } = useAppContext();
  const [skuPai, setSkuPai] = useState<SKU | null | undefined>(undefined); // undefined: loading, null: not found
  const [enrichedComponents, setEnrichedComponents] = useState<EnrichedBOMEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDataReady) {
      if (skuId) {
        const foundSku = findSkuById(skuId);
        setSkuPai(foundSku); // Define como null se não encontrado, ou o SKU se encontrado
        if (foundSku && foundSku.components) {
          const enriched = foundSku.components.map(comp => {
            const componentSku = findSkuById(comp.componentSkuId);
            return {
              ...comp,
              componentCode: componentSku?.code || 'N/D',
              componentDescription: componentSku?.description || 'Componente não encontrado',
            };
          });
          setEnrichedComponents(enriched);
        } else {
          setEnrichedComponents([]);
        }
      } else {
        // Se não há skuId nos params, mas os dados estão prontos, significa SKU não encontrado
        setSkuPai(null);
      }
      setIsLoading(false);
    }
  }, [skuId, isDataReady, findSkuById]);

  if (isLoading || !isDataReady) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-3 text-lg text-muted-foreground">Carregando dados da estrutura do SKU...</p>
      </div>
    );
  }

  if (!skuPai) {
    return (
      <div className="container mx-auto py-10 text-center">
        <PackageSearch className="mx-auto h-16 w-16 text-destructive mb-4" />
        <h1 className="text-2xl font-bold text-destructive mb-4">SKU Não Encontrado</h1>
        <p className="mb-6 text-muted-foreground">
          O SKU com o ID fornecido não foi encontrado ou nenhum ID foi especificado.
        </p>
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
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            Estrutura do SKU: <span className="text-primary">{skuPai.code}</span>
          </h1>
          <p className="text-muted-foreground">{skuPai.description}</p>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href={`/skus/${skuPai.id}/bom`}>
                    <Settings2 className="mr-2 h-4 w-4" /> Gerenciar Componentes (BOM)
                </Link>
            </Button>
            <Button asChild variant="outline">
            <Link href="/skus">
                <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para SKUs
            </Link>
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="text-xl">Componentes Diretos</CardTitle>
          <CardDescription>
            Lista de componentes que formam diretamente o SKU <span className="font-semibold text-primary">{skuPai.code}</span>.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {enrichedComponents.length > 0 ? (
            <div className="overflow-x-auto">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead className="w-[200px]">Código do Componente</TableHead>
                    <TableHead>Descrição do Componente</TableHead>
                    <TableHead className="text-right w-[180px]">Quantidade Necessária</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {enrichedComponents.map((comp, index) => (
                    <TableRow key={index} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-accent">{comp.componentCode}</TableCell>
                        <TableCell>{comp.componentDescription}</TableCell>
                        <TableCell className="text-right">{comp.quantity.toLocaleString('pt-BR')}</TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </div>
          ) : (
            <div className="py-10 text-center">
              <PackageSearch className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Este SKU não possui componentes diretos cadastrados em sua estrutura.
              </p>
              <Button variant="link" asChild className="mt-4 text-primary hover:text-primary/80">
                <Link href={`/skus/${skuPai.id}/bom`}>
                  Adicionar/Gerenciar Componentes
                </Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 
        Futuramente, poderíamos adicionar aqui:
        - Visualização hierárquica/em árvore para componentes de múltiplos níveis.
        - Cálculo de custo total baseado nos componentes.
        - Verificação de disponibilidade de componentes.
      */}
    </div>
  );
}
