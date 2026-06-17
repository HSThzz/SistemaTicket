/**
 * @file Geração de PDF de ingressos (placeholder para biblioteca real).
 * @module modules/notifications/application/services/generateTicketPdf
 */

import type { Prettify } from "../../../../shared/kernel/prettify";

export type GenerateTicketPdfInput = Prettify<{
  orderId: string;
  userName: string;
  ticketIds: string[];
}>;

/**
 * Gera o PDF do ingresso em anexo.
 * Plugue aqui uma lib como `pdfkit` ou um template HTML → PDF.
 */
export async function generateTicketPdf(
  input: GenerateTicketPdfInput,
): Promise<Buffer> {
  const lines = [
    "INGRESSO — SistemaTicket",
    `Pedido: ${input.orderId}`,
    `Titular: ${input.userName}`,
    `Ingressos: ${input.ticketIds.join(", ")}`,
    `Emitido em: ${new Date().toISOString()}`,
  ];

  return Buffer.from(lines.join("\n"), "utf-8");
}
