/**
 * @file Geração premium de PDF de ingressos com identidade VIBRA.
 * @module modules/notifications/application/services/generateTicketPdf
 */

import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { In } from "typeorm";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { Ticket } from "../../../../shared/infrastructure/persistence/entities/Ticket";
import type { Prettify } from "../../../../shared/kernel/prettify";
import { sanitizeDocument } from "../../../../shared/kernel/cpf";
import {
  formatTicketCheckInCode,
  getTicketQrPayload,
} from "../../../../shared/kernel/ticketCheckInCode";

const BRAND = {
  green: "#16a34a",
  greenMid: "#15803d",
  greenBright: "#22c55e",
  greenSoft: "#dcfce7",
  greenGlow: "#bbf7d0",
  dark: "#052e16",
  darkMid: "#0f3d22",
  text: "#111111",
  muted: "#525252",
  soft: "#737373",
  canvas: "#fafafa",
  border: "#e0e0dc",
  white: "#ffffff",
  accentOrange: "#ff5c1a",
  accentYellow: "#ffd60a",
} as const;

const PAGE = {
  width: 595.28,
  height: 841.89,
  margin: 42,
} as const;

const CARD = {
  width: 500,
  height: 620,
  radius: 18,
  headerHeight: 78,
  /** Margem interna — conteúdo fica à direita da faixa verde. */
  insetX: 28,
  accentX: 10,
  accentWidth: 6,
  /** Padding interno da caixa inferior (stub). */
  stubPadX: 22,
  stubPadY: 26,
} as const;

export type GenerateTicketPdfInput = Prettify<{
  orderId: string;
  userName: string;
  ticketIds: string[];
}>;

type TicketForPdf = Prettify<{
  id: string;
  uniqueCode: string;
  checkInCode: string;
  ownerName: string;
  ownerDocument: string;
  lotName: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation: string;
}>;

/**
 * Gera PDF válido com layout premium — um ingresso por página.
 */
export async function generateTicketPdf(
  input: GenerateTicketPdfInput,
): Promise<Buffer> {
  const tickets = await loadTickets(input.orderId, input.ticketIds);

  if (tickets.length === 0) {
    throw new Error(`No tickets found for order ${input.orderId}`);
  }

  if (tickets.length !== input.ticketIds.length) {
    throw new Error(
      `Incomplete ticket set for order ${input.orderId}: expected ${input.ticketIds.length}, found ${tickets.length}`,
    );
  }

  return renderPdf({
    orderId: input.orderId,
    userName: input.userName,
    tickets,
  });
}

async function loadTickets(
  orderId: string,
  ticketIds: string[],
): Promise<TicketForPdf[]> {
  if (ticketIds.length === 0) {
    return [];
  }

  const rows = await AppDataSource.getRepository(Ticket).find({
    where: { id: In(ticketIds), orderId },
    relations: ["ticketLot", "ticketLot.event"],
    order: { id: "ASC" },
  });

  const byId = new Map(
    rows.map((ticket) => [
      ticket.id,
      {
        id: ticket.id,
        uniqueCode: ticket.uniqueCode,
        checkInCode: ticket.checkInCode,
        ownerName: ticket.ownerName,
        ownerDocument: ticket.ownerDocument,
        lotName: ticket.ticketLot?.name ?? "Ingresso",
        eventTitle: ticket.ticketLot?.event?.title ?? "Evento",
        eventDate: ticket.ticketLot?.event?.date ?? new Date(),
        eventLocation: ticket.ticketLot?.event?.location ?? "Local a confirmar",
      } satisfies TicketForPdf,
    ]),
  );

  const ordered: TicketForPdf[] = [];
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
  tickets: TicketForPdf[];
}): Promise<Buffer> {
  const doc = new PDFDocument({
    size: "A4",
    margin: 0,
    autoFirstPage: false,
  });
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
    throw new Error(`Cannot render empty ticket PDF for order ${input.orderId}`);
  }

  for (const [index, ticket] of input.tickets.entries()) {
    doc.addPage();
    drawPageCanvas(doc);
    await drawTicketCard(doc, {
      ticket,
      index,
      total: input.tickets.length,
      orderId: input.orderId,
      buyerName: input.userName,
    });
  }

  doc.end();
  return pdfReady;
}

function drawPageCanvas(doc: InstanceType<typeof PDFDocument>): void {
  doc.save();
  doc.rect(0, 0, PAGE.width, PAGE.height).fill(BRAND.canvas);

  doc.fillOpacity(0.1);
  doc.circle(70, 90, 150).fill(BRAND.greenBright);
  doc.circle(PAGE.width - 60, 120, 120).fill(BRAND.greenMid);
  doc.circle(PAGE.width * 0.5, PAGE.height - 80, 180).fill(BRAND.greenGlow);
  doc.fillOpacity(1);

  drawPageGrid(doc);
  doc.restore();
}

/** Grid sutil igual ao hero da landing VIBRA. */
function drawPageGrid(doc: InstanceType<typeof PDFDocument>): void {
  doc.save();
  doc.strokeColor(BRAND.green);
  doc.lineWidth(0.4);
  doc.fillOpacity(0.05);

  const step = 36;
  for (let x = 0; x <= PAGE.width; x += step) {
    doc.moveTo(x, 0).lineTo(x, PAGE.height).stroke();
  }
  for (let y = 0; y <= PAGE.height; y += step) {
    doc.moveTo(0, y).lineTo(PAGE.width, y).stroke();
  }

  doc.fillOpacity(1);
  doc.restore();
}

async function drawTicketCard(
  doc: InstanceType<typeof PDFDocument>,
  input: {
    ticket: TicketForPdf;
    index: number;
    total: number;
    orderId: string;
    buyerName: string;
  },
): Promise<void> {
  const cardX = (PAGE.width - CARD.width) / 2;
  const cardY = 96;

  drawCardShell(doc, cardX, cardY);
  drawCardHeader(doc, cardX, cardY);

  const contentX = cardX + CARD.insetX;
  const contentWidth = CARD.width - CARD.insetX * 2;
  const eventPanelY = cardY + CARD.headerHeight + 18;

  drawEventPanel(doc, cardX, eventPanelY, input.ticket);

  let cursorY = eventPanelY + 118;
  drawLotBadge(doc, contentX, cursorY, input.ticket.lotName);
  cursorY += 34;

  const perforationY = cardY + 262;
  drawPerforation(doc, cardX + CARD.insetX, perforationY, CARD.width - CARD.insetX * 2);

  const stubY = perforationY + 18;
  const stubHeight = cardY + CARD.height - stubY - 24;
  const stubX = cardX + CARD.insetX;
  const stubWidth = CARD.width - CARD.insetX * 2;
  drawStubPanel(doc, stubX, stubY, stubWidth, stubHeight);

  const stubInnerX = stubX + CARD.stubPadX;
  const stubInnerRight = stubX + stubWidth - CARD.stubPadX;
  const lowerSectionY = stubY + CARD.stubPadY;
  const qrBoxSize = 152;
  const qrImageSize = 128;
  const qrBoxX = stubInnerRight - qrBoxSize;
  const leftColumnWidth = qrBoxX - stubInnerX - 20;

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor(BRAND.green)
    .text(`INGRESSO ${input.index + 1} DE ${input.total}`, stubInnerX, lowerSectionY, {
      width: leftColumnWidth,
      characterSpacing: 0.8,
    });

  let infoY = lowerSectionY + 28;

  infoY = drawInfoLine(doc, stubInnerX, infoY, leftColumnWidth, "Titular", input.ticket.ownerName);
  infoY = drawInfoLine(
    doc,
    stubInnerX,
    infoY,
    leftColumnWidth,
    "Documento",
    formatDocument(input.ticket.ownerDocument),
  );
  infoY = drawInfoLine(doc, stubInnerX, infoY, leftColumnWidth, "Comprador", input.buyerName);
  drawInfoLine(doc, stubInnerX, infoY, leftColumnWidth, "Pedido", shortenId(input.orderId));

  doc.save();
  doc
    .roundedRect(qrBoxX, lowerSectionY, qrBoxSize, qrBoxSize, 14)
    .lineWidth(1)
    .strokeColor(BRAND.border)
    .stroke();
  doc.restore();

  const qrPayload = getTicketQrPayload(input.ticket);
  const qrBuffer = await QRCode.toBuffer(qrPayload, {
    type: "png",
    width: 280,
    margin: 2,
    color: {
      dark: BRAND.dark,
      light: "#ffffff",
    },
    errorCorrectionLevel: "M",
  });

  const qrPadding = (qrBoxSize - qrImageSize) / 2;
  doc.image(
    qrBuffer,
    qrBoxX + qrPadding,
    lowerSectionY + qrPadding,
    {
      width: qrImageSize,
      height: qrImageSize,
    },
  );

  const qrHintY = lowerSectionY + qrBoxSize + 10;
  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(BRAND.soft)
    .text("Escaneie na entrada", qrBoxX, qrHintY, {
      width: qrBoxSize,
      align: "center",
    });

  const footerY = cardY + CARD.height - 42;
  doc
    .font("Helvetica")
    .fontSize(8.5)
    .fillColor(BRAND.soft)
    .text(
      `Código na portaria ${formatTicketCheckInCode(input.ticket.checkInCode)} · Documento nominal · VIBRA Ingressos`,
      contentX,
      footerY,
      {
        width: contentWidth,
        align: "center",
      },
    );

  drawAccentStripe(doc, cardX, cardY);
  drawCardBorder(doc, cardX, cardY);
}

function drawCardShell(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
): void {
  doc.save();
  doc.fillOpacity(0.12);
  doc
    .roundedRect(x + 2, y + 8, CARD.width, CARD.height, CARD.radius)
    .fill(BRAND.green);
  doc.fillOpacity(1);

  doc
    .roundedRect(x, y, CARD.width, CARD.height, CARD.radius)
    .fill(BRAND.white);
  doc.restore();
}

/** Faixa verde lateral — desenhada por cima do conteúdo para não ficar coberta. */
function drawAccentStripe(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
): void {
  const stripeTop = y + CARD.radius;
  const stripeBottom = y + CARD.height - CARD.radius;

  doc.save();
  doc
    .roundedRect(
      x + CARD.accentX,
      stripeTop,
      CARD.accentWidth,
      stripeBottom - stripeTop,
      2,
    )
    .fill(BRAND.green);
  doc.restore();
}

function drawCardBorder(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
): void {
  doc.save();
  doc
    .roundedRect(x, y, CARD.width, CARD.height, CARD.radius)
    .lineWidth(1.2)
    .strokeColor(BRAND.border)
    .stroke();
  doc.restore();
}

function drawEventPanel(
  doc: InstanceType<typeof PDFDocument>,
  cardX: number,
  y: number,
  ticket: TicketForPdf,
): void {
  const panelX = cardX + CARD.insetX;
  const panelWidth = CARD.width - CARD.insetX * 2;
  const panelHeight = 108;

  doc.save();
  doc
    .roundedRect(panelX, y, panelWidth, panelHeight, 12)
    .fill(BRAND.greenSoft);
  doc
    .roundedRect(panelX, y, panelWidth, panelHeight, 12)
    .lineWidth(1)
    .strokeColor(BRAND.greenBright)
    .strokeOpacity(0.25)
    .stroke();
  doc.strokeOpacity(1);
  doc.restore();

  const contentX = panelX + 16;
  const contentWidth = panelWidth - 32;

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor(BRAND.text)
    .text(ticket.eventTitle, contentX, y + 16, {
      width: contentWidth,
      lineGap: 1,
    });

  drawMetaRow(
    doc,
    contentX,
    y + 52,
    "Data",
    formatEventDate(ticket.eventDate),
    contentWidth,
  );
  drawMetaRow(doc, contentX, y + 78, "Local", ticket.eventLocation, contentWidth);
}

function drawLotBadge(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  lotName: string,
): void {
  const label = `LOTE · ${lotName.toUpperCase()}`;
  const fontSize = 8;
  const charSpacing = 0.6;
  const padX = 14;
  const badgeHeight = 22;

  doc.font("Helvetica-Bold").fontSize(fontSize);
  // Largura do texto incluindo o character spacing (nº de espaços = chars - 1).
  const textWidth =
    doc.widthOfString(label) + charSpacing * Math.max(0, label.length - 1);
  const badgeWidth = Math.min(CARD.width - CARD.insetX * 2, textWidth + padX * 2);

  doc.save();
  doc
    .roundedRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2)
    .fill(BRAND.white);
  doc
    .roundedRect(x, y, badgeWidth, badgeHeight, badgeHeight / 2)
    .lineWidth(1)
    .strokeColor(BRAND.green)
    .stroke();
  doc.restore();

  // Centraliza verticalmente o texto numa única linha (equivale a line-height:1 + nowrap).
  const textHeight = doc.currentLineHeight();
  const textY = y + (badgeHeight - textHeight) / 2;

  doc
    .font("Helvetica-Bold")
    .fontSize(fontSize)
    .fillColor(BRAND.green)
    .text(label, x, textY, {
      width: badgeWidth,
      align: "center",
      characterSpacing: charSpacing,
      lineBreak: false,
    });
}

function drawStubPanel(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
  height: number,
): void {
  doc.save();
  doc
    .roundedRect(x, y, width, height, 14)
    .fill("#f7faf7");
  doc
    .roundedRect(x, y, width, height, 14)
    .lineWidth(1)
    .strokeColor(BRAND.border)
    .stroke();
  doc.restore();
}

function drawCardHeader(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
): void {
  doc.save();
  const gradient = doc.linearGradient(x, y, x + CARD.width, y + CARD.headerHeight);
  gradient.stop(0, BRAND.dark);
  gradient.stop(1, BRAND.darkMid);

  doc
    .roundedRect(x, y, CARD.width, CARD.headerHeight, CARD.radius)
    .fill(gradient);
  doc
    .rect(x, y + CARD.headerHeight - CARD.radius, CARD.width, CARD.radius)
    .fill(gradient);

  doc.fillOpacity(0.16);
  doc.circle(x + CARD.width - 36, y + 24, 42).fill(BRAND.greenBright);
  doc.fillOpacity(1);

  drawHeaderStripes(doc, x, y);
  doc.restore();

  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(BRAND.greenBright)
    .text("INGRESSO OFICIAL", x + 28, y + 22, {
      characterSpacing: 1.4,
    });

  doc
    .font("Helvetica-Bold")
    .fontSize(30)
    .fillColor(BRAND.white)
    .text("VIBRA", x + 28, y + 36, {
      characterSpacing: -1,
    });

  doc
    .font("Helvetica")
    .fontSize(9)
    .fillColor(BRAND.greenGlow)
    .text("Ingressos", x + 128, y + 48);
}

function drawHeaderStripes(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
): void {
  doc.save();
  doc.strokeColor(BRAND.greenBright);
  doc.lineWidth(2);
  doc.fillOpacity(0.35);

  for (let offset = 0; offset < 5; offset += 1) {
    const stripeX = x + CARD.width - 120 + offset * 14;
    doc
      .moveTo(stripeX, y + 12)
      .lineTo(stripeX + 28, y + CARD.headerHeight - 12)
      .stroke();
  }

  doc.fillOpacity(1);
  doc.restore();
}

function drawMetaRow(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  label: string,
  value: string,
  width = CARD.width - CARD.insetX * 2,
): void {
  doc
    .font("Helvetica-Bold")
    .fontSize(9)
    .fillColor(BRAND.soft)
    .text(label.toUpperCase(), x, y, { characterSpacing: 0.7 });

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor(BRAND.text)
    .text(value, x, y + 12, { width });
}

/** Altura fixa de cada bloco label+valor — garante grade vertical idêntica. */
const INFO_BLOCK_STEP = 46;

function drawInfoLine(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
  label: string,
  value: string,
): number {
  const labelToValueGap = 17;

  doc
    .font("Helvetica-Bold")
    .fontSize(8.5)
    .fillColor(BRAND.soft)
    .text(label.toUpperCase(), x, y, {
      width,
      characterSpacing: 0.6,
      lineBreak: false,
    });

  doc
    .font("Helvetica")
    .fontSize(11.5)
    .fillColor(BRAND.text)
    .text(value, x, y + labelToValueGap, { width, lineBreak: false });

  return y + INFO_BLOCK_STEP;
}

function drawPerforation(
  doc: InstanceType<typeof PDFDocument>,
  x: number,
  y: number,
  width: number,
): void {
  doc.save();
  doc
    .moveTo(x, y)
    .lineTo(x + width, y)
    .dash(6, { space: 5 })
    .lineWidth(1)
    .strokeColor("#d4d4d4")
    .stroke();
  doc.undash();
  doc.restore();

  doc.save();
  doc.circle(x - 10, y, 10).fill(BRAND.canvas);
  doc.circle(x + width + 10, y, 10).fill(BRAND.canvas);
  doc.restore();
}

function formatEventDate(date: Date): string {
  const formatted = date.toLocaleString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDocument(document: string): string {
  const digits = sanitizeDocument(document);

  if (digits.length !== 11) {
    return document;
  }

  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function shortenId(value: string): string {
  if (value.length <= 14) {
    return value;
  }

  return `${value.slice(0, 8)}…${value.slice(-4)}`;
}
