/**
 * @file Templates HTML de e-mails transacionais.
 * @module modules/notifications/infrastructure/email/emailTemplates
 */

import { env } from "../../../../shared/infrastructure/config/env";
import type { ContactFormJobData } from "../../../leads/application/types/contactFormJob";
import type { TicketDeliveryJobData } from "../../application/types/ticketDeliveryJob";
import { renderEmailInfoCard, renderEmailLayout } from "./renderEmailLayout";

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function getPublicAppUrl(): string {
  const configured = process.env.APP_PUBLIC_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  return env.corsOrigins[0] ?? "https://sistema-ticket.vercel.app";
}

export function buildPurchaseConfirmationEmail(data: TicketDeliveryJobData): string {
  const ticketLabel =
    data.ticketIds.length === 1 ? "1 ingresso" : `${data.ticketIds.length} ingressos`;

  return renderEmailLayout({
    preheader: `Sua compra foi confirmada. ${ticketLabel} em anexo.`,
    eyebrow: "Confirmação de compra",
    title: "Seus ingressos estão prontos",
    bodyHtml: `
      <p style="margin: 0 0 12px;">Olá, <strong>${escapeHtml(data.userName)}</strong>.</p>
      <p style="margin: 0 0 12px;">
        Pagamento confirmado. Seus ingressos já estão disponíveis em PDF com QR code individual para check-in na entrada.
      </p>
      ${renderEmailInfoCard("Pedido", escapeHtml(data.orderId))}
      ${renderEmailInfoCard("Quantidade", escapeHtml(ticketLabel))}
      <p style="margin: 18px 0 0;">
        Abra o anexo no celular ou imprima em boa qualidade. Cada página do PDF corresponde a um ingresso nominal.
      </p>
    `,
    cta: {
      label: "Ver meus ingressos",
      href: `${getPublicAppUrl()}/ingressos`,
    },
    footerNote:
      "Guarde este e-mail e o PDF em local seguro. Os ingressos são nominais e validados por QR code na portaria.",
  });
}

export function buildLeadAcknowledgementEmail(data: ContactFormJobData): string {
  return renderEmailLayout({
    preheader: "Recebemos seu contato. Nossa equipe responde em até 1 dia útil.",
    eyebrow: "Para produtores",
    title: "Mensagem recebida",
    bodyHtml: `
      <p style="margin: 0 0 12px;">Olá, <strong>${escapeHtml(data.name)}</strong>.</p>
      <p style="margin: 0 0 12px;">
        Obrigado por entrar em contato com a VIBRA. Recebemos seus dados e nossa equipe comercial vai retornar em até <strong>1 dia útil</strong>.
      </p>
      ${renderEmailInfoCard("E-mail informado", escapeHtml(data.email))}
      <p style="margin: 18px 0 0;">
        Enquanto isso, você pode conhecer a plataforma e ver como produtores publicam eventos, vendem ingressos e acompanham tudo em tempo real.
      </p>
    `,
    cta: {
      label: "Conhecer a VIBRA",
      href: `${getPublicAppUrl()}/para-produtores`,
    },
  });
}

export function buildProducerLeadInternalEmail(data: ContactFormJobData): string {
  const phoneRow = data.phone
    ? `<tr><td style="padding: 10px 0; border-bottom: 1px solid #ececec; color: #525252;">Telefone</td><td style="padding: 10px 0; border-bottom: 1px solid #ececec; font-weight: 600;">${escapeHtml(data.phone)}</td></tr>`
    : "";

  return renderEmailLayout({
    preheader: `Novo lead de produtor: ${data.name}`,
    eyebrow: "Alerta interno",
    title: "Novo lead no formulário",
    bodyHtml: `
      <p style="margin: 0 0 16px;">Um produtor enviou o formulário de contato da landing.</p>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="font-size: 14px; color: #171717;">
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #ececec; color: #525252; width: 120px;">Lead ID</td><td style="padding: 10px 0; border-bottom: 1px solid #ececec; font-weight: 600;">${escapeHtml(data.leadId)}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #ececec; color: #525252;">Nome</td><td style="padding: 10px 0; border-bottom: 1px solid #ececec; font-weight: 600;">${escapeHtml(data.name)}</td></tr>
        <tr><td style="padding: 10px 0; border-bottom: 1px solid #ececec; color: #525252;">E-mail</td><td style="padding: 10px 0; border-bottom: 1px solid #ececec; font-weight: 600;">${escapeHtml(data.email)}</td></tr>
        ${phoneRow}
      </table>
    `,
    footerNote: "Lead salvo no banco. Responda o contato pelo canal comercial da equipe.",
  });
}
