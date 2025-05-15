
"use client";

import { useState, useEffect } from 'react';
import { format, parse, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';
import { ptBR } from 'date-fns/locale'; // Importar ptBR

interface ClientSideDateTimeProps {
  dateString: string | undefined | null;
  outputFormat: string;
  inputFormat?: string; 
  locale?: Locale; 
  placeholder?: string;
}

export function ClientSideDateTime({
  dateString,
  outputFormat,
  inputFormat,
  locale = ptBR, // Definir ptBR como padrão
  placeholder = "Carregando...",
}: ClientSideDateTimeProps) {
  const [formattedOutput, setFormattedOutput] = useState<string>(placeholder);

  useEffect(() => {
    if (dateString) {
      try {
        let date: Date;
        if (inputFormat) {
          date = parse(dateString, inputFormat, new Date()); 
        } else {
          date = parseISO(dateString); 
        }
        
        const formatOptions = locale ? { locale } : {};
        setFormattedOutput(format(date, outputFormat, formatOptions));

      } catch (error) {
        console.error(`Erro ao formatar data "${dateString}" com formato de entrada "${inputFormat}" e formato de saída "${outputFormat}":`, error);
        setFormattedOutput(dateString || placeholder); 
      }
    } else {
      setFormattedOutput(placeholder); 
    }
  }, [dateString, outputFormat, inputFormat, locale, placeholder]);

  return <>{formattedOutput}</>;
}
