/**
 * @file Formatação de moeda e datas para exibição em português (pt-BR).
 * @module utils/format
 */

/**
 * Formata um valor em centavos como moeda BRL.
 *
 * @param cents - Valor inteiro em centavos.
 */
export function formatCurrencyFromCents(cents: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(cents / 100);
}

/**
 * Formata data/hora ISO em estilo completo (data + hora).
 *
 * @param isoDate - Data em formato ISO 8601.
 */
export function formatEventDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date(isoDate));
}

/**
 * Formata data/hora ISO de forma compacta para listagens.
 *
 * @param isoDate - Data em formato ISO 8601.
 */
export function formatShortDate(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

/**
 * Exibe apenas a parte da data (sem hora).
 *
 * @param isoDate - Data em formato ISO 8601.
 */
export function formatEventDateOnly(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(isoDate));
}

/**
 * Exibe apenas hora e minuto de uma data ISO.
 *
 * @param isoDate - Data em formato ISO 8601.
 */
export function formatEventTimeOnly(isoDate: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(isoDate));
}

/**
 * Data compacta estilo vitrine (ex.: "sáb., 19 de set.").
 *
 * @param isoDate - Data em formato ISO 8601.
 */
export function formatEventDateDice(isoDate: string): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(isoDate));

  return formatted.replace(/\.$/, "");
}

/** Remove caracteres não numéricos de CPF/CNPJ. */
export function normalizeDocument(value: string): string {
  return value.replace(/\D/g, "");
}

/** Formata CPF parcial para exibição (000.000.000-00). */
export function formatCpf(value: string): string {
  const digits = normalizeDocument(value).slice(0, 11);

  if (digits.length <= 3) {
    return digits;
  }

  if (digits.length <= 6) {
    return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  }

  if (digits.length <= 9) {
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
