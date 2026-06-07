import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { ptBR, enUS, es, fr, ja, de } from 'date-fns/locale';

// ─── Class Merge ──────────────────────────────────────────────────────────────
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ─── Currency ─────────────────────────────────────────────────────────────────
export function formatCurrency(
  value: number,
  currency = 'BRL',
  locale = 'pt-BR'
): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}

// ─── Date/Time ────────────────────────────────────────────────────────────────
const dateLocales: Record<string, Locale> = {
  'pt-BR': ptBR,
  'en': enUS,
  'es': es,
  'fr': fr,
  'ja': ja,
  'de': de,
};

export function formatDate(
  date: string | Date,
  pattern = 'dd/MM/yyyy',
  locale = 'pt-BR'
): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern, { locale: dateLocales[locale] || ptBR });
}

export function formatTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'HH:mm');
}

export function timeAgo(date: string | Date, locale = 'pt-BR'): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, {
    addSuffix: true,
    locale: dateLocales[locale] || ptBR,
  });
}

// ─── String Helpers ───────────────────────────────────────────────────────────
export function truncate(str: string, length: number): string {
  if (str.length <= length) return str;
  return str.slice(0, length).trimEnd() + '…';
}

export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split('@');
  return `${user.slice(0, 2)}${'*'.repeat(user.length - 2)}@${domain}`;
}

// ─── Number Helpers ───────────────────────────────────────────────────────────
export function formatNumber(n: number, locale = 'pt-BR'): string {
  return new Intl.NumberFormat(locale).format(n);
}

export function formatPercent(n: number): string {
  return `${n >= 0 ? '+' : ''}${n}%`;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// ─── Array Helpers ────────────────────────────────────────────────────────────
export function chunk<T>(arr: T[], size: number): T[][] {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size)
  );
}

export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

export function unique<T>(arr: T[], key?: keyof T): T[] {
  if (!key) return [...new Set(arr)];
  const seen = new Set();
  return arr.filter((item) => {
    const k = item[key];
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

// ─── URL Helpers ──────────────────────────────────────────────────────────────
export function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  }
  const str = searchParams.toString();
  return str ? `?${str}` : '';
}

export function getSearchParam(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get(key);
}

// ─── Validation ───────────────────────────────────────────────────────────────
export const validators = {
  email: (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
  password: (v: string) => v.length >= 8 && /[A-Z]/.test(v) && /[0-9]/.test(v),
  username: (v: string) => /^[a-zA-Z0-9_]{3,30}$/.test(v),
  phone: (v: string) => /^\+?[\d\s\-().]{8,20}$/.test(v),
  zipCode: (v: string) => /^\d{5}-?\d{3}$/.test(v),
  cpf: (v: string) => {
    const digits = v.replace(/\D/g, '');
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check = (sum * 10) % 11;
    if (check >= 10) check = 0;
    if (check !== parseInt(digits[9])) return false;
    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    check = (sum * 10) % 11;
    if (check >= 10) check = 0;
    return check === parseInt(digits[10]);
  },
};

// ─── File Helpers ─────────────────────────────────────────────────────────────
export function formatFileSize(bytes: number): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function isImageFile(filename: string): boolean {
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'avif'].includes(
    getFileExtension(filename)
  );
}

// ─── Clipboard ────────────────────────────────────────────────────────────────
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  }
}

// ─── Debounce ─────────────────────────────────────────────────────────────────
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

// ─── Storage (safe) ───────────────────────────────────────────────────────────
export const safeStorage = {
  get: (key: string): string | null => {
    try { return localStorage.getItem(key); }
    catch { return null; }
  },
  set: (key: string, value: string): void => {
    try { localStorage.setItem(key, value); }
    catch { /* Quota exceeded */ }
  },
  remove: (key: string): void => {
    try { localStorage.removeItem(key); }
    catch { /* ignore */ }
  },
};
