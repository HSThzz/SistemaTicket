/**
 * @file Código curto de check-in legível na portaria (QR + digitação manual).
 * @module shared/kernel/ticketCheckInCode
 */

import { randomBytes } from "node:crypto";

/** Alfabeto sem caracteres ambíguos (0/O, 1/I/L). */
const CHECK_IN_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export const TICKET_CHECK_IN_CODE_LENGTH = 8;

/**
 * Gera código compacto de 8 caracteres para QR e digitação manual.
 */
export function generateTicketCheckInCode(): string {
  const bytes = randomBytes(TICKET_CHECK_IN_CODE_LENGTH);
  let code = "";

  for (let index = 0; index < TICKET_CHECK_IN_CODE_LENGTH; index += 1) {
    code += CHECK_IN_ALPHABET[bytes[index]! % CHECK_IN_ALPHABET.length];
  }

  return code;
}

/** Normaliza entrada da portaria (remove espaços/hífens, maiúsculas). */
export function compactTicketCheckInCode(raw: string): string {
  return raw.trim().replace(/[\s-]/g, "").toUpperCase();
}

/** Formata para exibição humana: `ABCD-EFGH`. */
export function formatTicketCheckInCode(raw: string): string {
  const compact = compactTicketCheckInCode(raw);

  if (compact.length <= 4) {
    return compact;
  }

  return `${compact.slice(0, 4)}-${compact.slice(4, TICKET_CHECK_IN_CODE_LENGTH)}`;
}

/** Payload do QR — preferir código curto; fallback para ingressos legados. */
export function getTicketQrPayload(ticket: {
  checkInCode: string | null | undefined;
  uniqueCode: string;
}): string {
  if (ticket.checkInCode?.trim()) {
    return ticket.checkInCode.trim();
  }

  return ticket.uniqueCode;
}

/**
 * Resolve busca no banco a partir do valor lido/digitado.
 * Aceita código curto ou `uniqueCode` legado (hex longo).
 */
export function resolveTicketLookupCodes(raw: string): {
  compactCheckInCode: string;
  uniqueCode: string | null;
} {
  const compact = compactTicketCheckInCode(raw);

  if (/^[a-f0-9]{32,128}$/i.test(compact)) {
    return {
      compactCheckInCode: compact,
      uniqueCode: compact.toLowerCase(),
    };
  }

  return {
    compactCheckInCode: compact,
    uniqueCode: null,
  };
}
