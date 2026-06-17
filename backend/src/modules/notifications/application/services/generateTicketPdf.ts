/**
 * @file Geração de PDF de ingressos com QR code para check-in.
 * @module modules/notifications/application/services/generateTicketPdf
 */

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { In } from "typeorm";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { sanitizeDocument } from "../../../../shared/kernel/cpf";

export type GenerateTicketPdfInput = Prettify<{
  orderId: string;
  userName: string;
  ticketIds: string[];
}>;

type TicketRow = Pick<Ticket, "id" | "uniqueCode" | "ownerName" | "ownerDocument">;

/**
 * Gera um PDF válido com um ingresso por página e QR code do código único.
 */
export async function generateTicketPdf(
  input: GenerateTicketPdfInput,
): Promise<Buffer> {
  const tickets = await loadTickets(input.ticketIds);

  return renderPdf({
    orderId: input.orderId,
    userName: input.userName,
    tickets,
  });
}

async function loadTickets(ticketIds: string[]): Promise<TicketRow[]> {
  if (ticketIds.length === 0) {
    return [];
  }

  const rows = await AppDataSource.getRepository(Ticket).find({
    where: { id: In(ticketIds) },
    select: ["id", "uniqueCode", "ownerName", "ownerDocument"],
    order: { id: "ASC" },
  });

  const byId = new Map(rows.map((ticket) => [ticket.id, ticket]));

  const ordered: TicketRow[] = [];
  for (const ticketId of ticketIds) {
    const ticket = byId.get(ticketId);
    if (ticket) {
      ordered.push(ticket);
    }
  }

  return ordered;
}

async function renderPdf(input: {
  orderId: string;
  userName: string;
  tickets: TicketRow[];
}): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 48, autoFirstPage: false });
  const chunks: Buffer[] = [];

  doc.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });

  const pdfReady = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => {
      resolve(Buffer.concat(chunks));
    });
    doc.on("error", reject);
  });

  if (input.tickets.length === 0) {
    doc.addPage();
    drawHeader(doc, input.orderId, input.userName);
    doc
      .fontSize(12)
      .fillColor("#444444")
      .text("Nenhum ingresso encontrado para este pedido.", { align: "left" });
    doc.end();
    return pdfReady;
  }

  for (const [index, ticket] of input.tickets.entries()) {
    doc.addPage();
    drawHeader(doc, input.orderId, input.userName);

    doc
      .fontSize(16)
      .fillColor("#111111")
      .text(`Ingresso ${index + 1} de ${input.tickets.length}`, {
        underline: true,
      });

    doc.moveDown(0.75);

    doc
      .fontSize(12)
      .fillColor("#222222")
      .text(`Titular: ${ticket.ownerName}`)
      .text(`Documento: ${formatDocument(ticket.ownerDocument)}`)
      .text(`Código: ${ticket.uniqueCode}`);

    doc.moveDown(1);

    const qrBuffer = await QRCode.toBuffer(ticket.uniqueCode, {
      type: "png",
      width: 220,
      margin: 1,
      errorCorrectionLevel: "M",
    });

    const qrX = (doc.page.width - 180) / 2;
    doc.image(qrBuffer, qrX, doc.y, { fit: [180, 180] });
    doc.moveDown(12);

    doc
      .fontSize(10)
      .fillColor("#666666")
      .text("Apresente este QR code na entrada do evento.", {
        align: "center",
      });
  }

  doc.end();
  return pdfReady;
}

function drawHeader(
  doc: InstanceType<typeof PDFDocument>,
  orderId: string,
  userName: string,
): void {
  doc
    .fontSize(20)
    .fillColor("#111111")
    .text("SistemaTicket", { align: "center" });

  doc.moveDown(0.25);

  doc
    .fontSize(11)
    .fillColor("#555555")
    .text(`Pedido ${orderId}`, { align: "center" })
    .text(`Comprador: ${userName}`, { align: "center" })
    .text(`Emitido em ${formatIssuedAt(new Date())}`, { align: "center" });

  doc.moveDown(1.25);
}

function formatIssuedAt(date: Date): string {
  return date.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function formatDocument(document: string): string {
  const digits = sanitizeDocument(document);

  if (digits.length !== 11) {
    return document;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}
