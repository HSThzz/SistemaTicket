/**
 * @file Utilitários de código curto de check-in (espelho do backend).
 * @module utils/ticketCheckInCode
 */

export function compactTicketCheckInCode(raw: string): string {
  return raw.trim().replace(/[\s-]/g, "").toUpperCase();
}

/** Formata para exibição: `ABCD-EFGH`. */
export function formatTicketCheckInCode(raw: string): string {
  const compact = compactTicketCheckInCode(raw);

  if (compact.length <= 4) {
    return compact;
  }

  return `${compact.slice(0, 4)}-${compact.slice(4, 8)}`;
}

export function getTicketQrPayload(ticket: {
  checkInCode?: string | null;
  uniqueCode?: string | null;
}): string {
  if (ticket.checkInCode?.trim()) {
    return ticket.checkInCode.trim();
  }

  return ticket.uniqueCode?.trim() ?? "";
}
