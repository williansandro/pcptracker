
"use client";

import { useState, useEffect } from 'react';
import { format, parse, parseISO } from 'date-fns';
import type { Locale } from 'date-fns';

interface ClientSideDateTimeProps {
  dateString: string | undefined | null;
  outputFormat: string;
  inputFormat?: string; // e.g., 'yyyy-MM' for parsing non-ISO strings
  locale?: Locale; // For date-fns localization
  placeholder?: string;
}

export function ClientSideDateTime({
  dateString,
  outputFormat,
  inputFormat,
  locale,
  placeholder = "...",
}: ClientSideDateTimeProps) {
  const [formattedOutput, setFormattedOutput] = useState<string>(placeholder);

  useEffect(() => {
    if (dateString) {
      try {
        let date: Date;
        if (inputFormat) {
          // Use current date as a base for parsing if day/month/year parts are missing
          date = parse(dateString, inputFormat, new Date()); 
        } else {
          // Assume ISO string if no inputFormat is provided
          date = parseISO(dateString); 
        }
        
        const formatOptions = locale ? { locale } : {};
        setFormattedOutput(format(date, outputFormat, formatOptions));

      } catch (error) {
        console.error(`Error formatting date string "${dateString}" with input format "${inputFormat}" and output format "${outputFormat}":`, error);
        // Fallback to original string or a more informative error placeholder on parsing/formatting error
        setFormattedOutput(dateString || placeholder); 
      }
    } else {
      // Handles null or undefined dateString by showing placeholder
      setFormattedOutput(placeholder); 
    }
  }, [dateString, outputFormat, inputFormat, locale, placeholder]);

  return <>{formattedOutput}</>;
}
