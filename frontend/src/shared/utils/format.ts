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
 * Preço de lote/pedido: "Gratuito" quando zero, senão moeda BRL.
 */
export function formatLotPrice(cents: number): string {
  if (cents === 0) {
    return "Gratuito";
  }

  return formatCurrencyFromCents(cents);
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

/** CPF formatado completo: `000.000.000-00` (14 caracteres). */
export const CPF_FORMATTED_MAX_LENGTH = 14;

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

/** Telefone BR formatado completo: `(11) 99999-9999` (15 caracteres). */
export const PHONE_BR_FORMATTED_MAX_LENGTH = 15;

/** Formata telefone BR parcial (fixos / celular). */
export function formatPhoneBr(value: string): string {
  const digits = normalizeDocument(value).slice(0, 11);

  if (digits.length === 0) {
    return "";
  }

  if (digits.length <= 2) {
    return `(${digits}`;
  }

  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);

  if (rest.length <= 4) {
    return `(${ddd}) ${rest}`;
  }

  if (digits.length <= 10) {
    return `(${ddd}) ${rest.slice(0, 4)}-${rest.slice(4)}`;
  }

  return `(${ddd}) ${rest.slice(0, 5)}-${rest.slice(5)}`;
}

/** Limite de username do Instagram (sem `@`). */
export const INSTAGRAM_HANDLE_MAX_LENGTH = 30;

/** Campo de input com `@` + handle: no máx. 31 caracteres. */
export const INSTAGRAM_HANDLE_INPUT_MAX_LENGTH = INSTAGRAM_HANDLE_MAX_LENGTH + 1;

/**
 * Normaliza handle Instagram (remove `@` / URL) e limita ao tamanho oficial.
 */
export function normalizeInstagramHandle(value: string): string {
  let handle = value.trim().replace(/^@+/, "");

  const urlMatch = handle.match(
    /(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)/i,
  );
  if (urlMatch?.[1]) {
    handle = urlMatch[1];
  }

  handle = (handle.replace(/\/+$/, "").split(/[/?#]/)[0] ?? "")
    .replace(/^@+/, "")
    .replace(/[^a-zA-Z0-9._]/g, "")
    .slice(0, INSTAGRAM_HANDLE_MAX_LENGTH);

  return handle;
}

/** Exibe o handle com `@` enquanto o usuário digita. */
export function formatInstagramHandleInput(value: string): string {
  const handle = normalizeInstagramHandle(value);
  return handle ? `@${handle}` : "";
}

/** URL do perfil a partir do handle (com ou sem `@`). */
export function buildInstagramProfileUrl(handle: string): string {
  const normalized = normalizeInstagramHandle(handle);
  return `https://www.instagram.com/${encodeURIComponent(normalized)}/`;
}

/**
 * Digitos do telefone para WhatsApp (E.164 sem `+`).
 * Aceita formato BR com/sem DDI `55`.
 */
export function normalizePhoneDigitsForWhatsApp(value: string): string {
  let digits = value.replace(/\D/g, "");
  if (!digits) {
    return "";
  }

  // Remove zero à esquerda de operadora (ex.: 015… → 15…).
  if (digits.startsWith("0")) {
    digits = digits.replace(/^0+/, "");
  }

  if (digits.startsWith("55") && (digits.length === 12 || digits.length === 13)) {
    return digits;
  }

  if (digits.length === 10 || digits.length === 11) {
    return `55${digits}`;
  }

  return digits;
}

/** Link `wa.me` a partir do telefone informado (BR ou com DDI). */
export function buildWhatsAppUrl(phone: string): string | null {
  const digits = normalizePhoneDigitsForWhatsApp(phone);
  if (digits.length < 12) {
    return null;
  }
  return `https://wa.me/${digits}`;
}
