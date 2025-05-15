"use client";

import { useEffect, useState } from 'react';
import type { ProductionOrder } from '@/types';
import { Clock } from 'lucide-react';
import { formatDuration } from '@/lib/utils'; // Importar de utils

interface PoTimerProps {
  productionOrder: ProductionOrder;
}

export function PoTimer({ productionOrder }: PoTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (productionOrder.status === 'Em Progresso' && productionOrder.startTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const start = new Date(productionOrder.startTime!).getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      };
      updateTimer(); 
      intervalId = setInterval(updateTimer, 1000);
    } else if (productionOrder.status === 'Concluída' && productionOrder.productionTime) {
      setElapsedTime(productionOrder.productionTime);
    } else {
      setElapsedTime(0); // Para status 'Aberta' ou 'Cancelada' ou se não houver tempo.
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [productionOrder.status, productionOrder.startTime, productionOrder.productionTime]);

  if (productionOrder.status === 'Aberta' || productionOrder.status === 'Cancelada' || (!productionOrder.startTime && !productionOrder.productionTime)) {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center text-sm">
      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
      {formatDuration(elapsedTime)}
    </div>
  );
}
