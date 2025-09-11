import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Bilingual message formatter used for N8N envelopes and other API errors
// Accepts either a plain string or an object with optional { en, ar } fields
export type BiMessage = string | { en?: string; ar?: string } | null | undefined;

export function formatBiMessage(msg: BiMessage, lang: 'en' | 'ar' = 'en'): string {
  if (!msg) return '';

  if (typeof msg === 'string') return msg;

  // If it's an object with translations, pick based on preferred language with sensible fallbacks
  if (typeof msg === 'object') {
    const m = msg as { en?: string; ar?: string };
    if (lang === 'ar') return m.ar || m.en || '';
    return m.en || m.ar || '';
  }

  // Fallback to stringified value to avoid [object Object]
  try {
    return JSON.stringify(msg);
  } catch {
    return String(msg);
  }
}

