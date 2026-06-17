/**
 * @file Templates HTML de e-mails transacionais.
 * @module modules/notifications/infrastructure/email/emailTemplates
 */

import { env } from "../../../../shared/infrastructure/config/env";
import type { ContactFormJobData } from "../../../leads/application/types/contactFormJob";
import type { TicketDeliveryJobData } from "../../application/types/ticketDeliveryJob";
import { renderEmailDataList, renderEmailInfoCard, renderEmailLayout } from "./renderEmailLayout";

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
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Olá, <strong style="color:#111111;">${escapeHtml(data.userName)}</strong>.
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 4px;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Pagamento confirmado. Seus ingressos já estão disponíveis em PDF com QR code individual para check-in na entrada.
          </td>
        </tr>
      </table>
      ${renderEmailInfoCard("Pedido", escapeHtml(data.orderId))}
      ${renderEmailInfoCard("Quantidade", escapeHtml(ticketLabel))}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:16px 0 0;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Abra o anexo no celular ou imprima em boa qualidade. Cada página do PDF corresponde a um ingresso nominal.
          </td>
        </tr>
      </table>
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
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:0 0 12px;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Olá, <strong style="color:#111111;">${escapeHtml(data.name)}</strong>.
          </td>
        </tr>
        <tr>
          <td style="padding:0 0 4px;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Obrigado por entrar em contato com a VIBRA. Recebemos seus dados e nossa equipe comercial vai retornar em até <strong style="color:#111111;">1 dia útil</strong>.
          </td>
        </tr>
      </table>
      ${renderEmailInfoCard("E-mail informado", escapeHtml(data.email))}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:16px 0 0;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Enquanto isso, você pode conhecer a plataforma e ver como produtores publicam eventos, vendem ingressos e acompanham tudo em tempo real.
          </td>
        </tr>
      </table>
    `,
    cta: {
      label: "Conhecer a VIBRA",
      href: `${getPublicAppUrl()}/para-produtores`,
    },
  });
}

export function buildProducerLeadInternalEmail(data: ContactFormJobData): string {
  const fields = [
    { label: "Lead ID", value: escapeHtml(data.leadId) },
    { label: "Nome", value: escapeHtml(data.name) },
    { label: "E-mail", value: escapeHtml(data.email) },
  ];

  if (data.phone) {
    fields.push({ label: "Telefone", value: escapeHtml(data.phone) });
  }

  return renderEmailLayout({
    preheader: `Novo lead de produtor: ${data.name}`,
    eyebrow: "Alerta interno",
    title: "Novo lead no formulário",
    bodyHtml: `
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td style="padding:0 0 8px;font-size:15px;line-height:1.7;color:#555555;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
            Um produtor enviou o formulário de contato da landing.
          </td>
        </tr>
      </table>
      ${renderEmailDataList(fields)}
    `,
    footerNote: "Lead salvo no banco. Responda o contato pelo canal comercial da equipe.",
  });
}
