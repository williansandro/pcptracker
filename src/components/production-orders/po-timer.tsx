"use client";

import { useEffect, useState } from 'react';
import type { ProductionOrder } from '@/types';
import { Clock } from 'lucide-react';

interface PoTimerProps {
  productionOrder: ProductionOrder;
}

function formatDuration(totalSeconds: number): string {
  if (totalSeconds < 0) totalSeconds = 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

export function PoTimer({ productionOrder }: PoTimerProps) {
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (productionOrder.status === 'In Progress' && productionOrder.startTime) {
      const updateTimer = () => {
        const now = new Date().getTime();
        const start = new Date(productionOrder.startTime!).getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      };
      updateTimer(); // Initial update
      intervalId = setInterval(updateTimer, 1000);
    } else if (productionOrder.status === 'Completed' && productionOrder.productionTime) {
      setElapsedTime(productionOrder.productionTime);
    } else {
      setElapsedTime(0);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [productionOrder.status, productionOrder.startTime, productionOrder.productionTime]);

  if (productionOrder.status === 'Open' || productionOrder.status === 'Cancelled') {
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  return (
    <div className="flex items-center text-sm">
      <Clock className="mr-1 h-4 w-4 text-muted-foreground" />
      {formatDuration(elapsedTime)}
    </div>
  );
}
