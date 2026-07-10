/**
 * @file Templates HTML de e-mails transacionais.
 * @module modules/notifications/infrastructure/email/emailTemplates
 */

import { env } from "../../../../shared/infrastructure/config/env";
import type { ContactFormJobData } from "../../../leads/application/types/contactFormJob";
import type { ParticipationApprovedJobData } from "../../../participation/application/types/participationApprovedJob";
import type { ParticipationRejectedJobData } from "../../../participation/application/types/participationRejectedJob";
import type { ParticipationRequestSubmittedJobData } from "../../../participation/application/types/participationRequestSubmittedJob";
import type { TicketDeliveryJobData } from "../../application/types/ticketDeliveryJob";
import { EMAIL_BRAND } from "./emailBrand";
import { renderEmailDataList, renderEmailInfoCard, renderEmailInfoCardGroup, renderEmailLayout } from "./renderEmailLayout";

const F = EMAIL_BRAND.font;

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

function bodyParagraph(content: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
      <tr>
        <td bgcolor="${EMAIL_BRAND.surface}" style="padding:0 0 14px;background-color:${EMAIL_BRAND.surface};">
          <font face="${F}" color="${EMAIL_BRAND.textMuted}" style="font-size:16px;line-height:1.6;">
            ${content}
          </font>
        </td>
      </tr>
    </table>
  `;
}

export function buildPurchaseConfirmationEmail(data: TicketDeliveryJobData): string {
  const ticketLabel =
    data.ticketIds.length === 1 ? "1 ingresso" : `${data.ticketIds.length} ingressos`;

  return renderEmailLayout({
    preheader: `Sua compra foi confirmada. ${ticketLabel} em anexo.`,
    eyebrow: "Confirmação de compra",
    title: "Seus ingressos estão prontos",
    bodyHtml: `
      ${bodyParagraph(`Olá, <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.userName)}</b></font>.`)}
      ${bodyParagraph(
        "Pagamento confirmado. Seus ingressos já estão disponíveis em PDF com QR code individual para check-in na entrada.",
      )}
      ${renderEmailInfoCardGroup([
        { label: "Pedido", value: escapeHtml(data.orderId), mono: true },
        { label: "Quantidade", value: escapeHtml(ticketLabel) },
      ])}
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
        <tr>
          <td height="16" bgcolor="${EMAIL_BRAND.surface}" style="height:16px;font-size:1px;background-color:${EMAIL_BRAND.surface};">&nbsp;</td>
        </tr>
        <tr>
          <td bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
            <font face="${F}" color="${EMAIL_BRAND.textMuted}" style="font-size:16px;line-height:1.6;">
              Abra o anexo no celular ou imprima em boa qualidade. Cada página do PDF corresponde a um ingresso nominal.
            </font>
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
      ${bodyParagraph(`Olá, <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.name)}</b></font>.`)}
      ${bodyParagraph(
        `Obrigado por entrar em contato com a VIBRA. Recebemos seus dados e nossa equipe comercial vai retornar em até <font color="${EMAIL_BRAND.text}"><b>1 dia útil</b></font>.`,
      )}
      ${renderEmailInfoCard("E-mail informado", escapeHtml(data.email), { mono: true })}
      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
        <tr>
          <td height="16" bgcolor="${EMAIL_BRAND.surface}" style="height:16px;font-size:1px;background-color:${EMAIL_BRAND.surface};">&nbsp;</td>
        </tr>
        <tr>
          <td bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
            <font face="${F}" color="${EMAIL_BRAND.textMuted}" style="font-size:16px;line-height:1.6;">
              Enquanto isso, você pode conhecer a plataforma e ver como produtores publicam eventos, vendem ingressos e acompanham tudo em tempo real.
            </font>
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
      ${bodyParagraph("Um produtor enviou o formulário de contato da landing.")}
      ${renderEmailDataList(fields)}
    `,
    footerNote: "Lead salvo no banco. Responda o contato pelo canal comercial da equipe.",
  });
}

export function buildParticipationApprovedEmail(
  data: ParticipationApprovedJobData,
): string {
  const eventUrl = `${getPublicAppUrl()}/eventos/${data.eventId}`;

  return renderEmailLayout({
    preheader: `Sua participação em ${data.eventTitle} foi aprovada. Garanta seu ingresso.`,
    eyebrow: "Evento privado",
    title: "Participação aprovada",
    bodyHtml: `
      ${bodyParagraph(`Olá, <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.participantName)}</b></font>.`)}
      ${bodyParagraph(
        `Boas notícias: o produtor aprovou sua solicitação para participar de <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.eventTitle)}</b></font>.`,
      )}
      ${bodyParagraph(
        "Agora você pode acessar a página do evento e concluir a compra do ingresso pelo fluxo normal de checkout.",
      )}
      ${renderEmailInfoCard("Evento", escapeHtml(data.eventTitle))}
    `,
    cta: {
      label: "Comprar ingresso",
      href: eventUrl,
    },
    footerNote:
      "Este link leva à página pública do evento. Faça login com a mesma conta usada na solicitação para reservar.",
  });
}

export function buildParticipationRejectedEmail(
  data: ParticipationRejectedJobData,
): string {
  const eventsUrl = `${getPublicAppUrl()}/eventos`;

  return renderEmailLayout({
    preheader: `Sua solicitação para ${data.eventTitle} não foi aprovada.`,
    eyebrow: "Evento privado",
    title: "Participação não aprovada",
    bodyHtml: `
      ${bodyParagraph(`Olá, <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.participantName)}</b></font>.`)}
      ${bodyParagraph(
        `Infelizmente o produtor não aprovou sua solicitação para participar de <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.eventTitle)}</b></font>.`,
      )}
      ${bodyParagraph(
        "Isso não impede você de explorar outros eventos públicos na plataforma. Se tiver dúvidas, entre em contato diretamente com o organizador.",
      )}
      ${renderEmailInfoCard("Evento", escapeHtml(data.eventTitle))}
    `,
    cta: {
      label: "Ver outros eventos",
      href: eventsUrl,
    },
    footerNote:
      "Esta decisão foi tomada pelo produtor do evento. Você não poderá comprar ingresso para este evento privado.",
  });
}

export function buildParticipationRequestSubmittedEmail(
  data: ParticipationRequestSubmittedJobData,
): string {
  const manageUrl = `${getPublicAppUrl()}/produtor/eventos/${data.eventId}`;
  const phoneRow = data.participantPhone
    ? renderEmailInfoCard("Telefone", escapeHtml(data.participantPhone))
    : "";

  return renderEmailLayout({
    preheader: `${data.participantName} solicitou participação em ${data.eventTitle}.`,
    eyebrow: "Evento privado",
    title: "Nova solicitação de participação",
    bodyHtml: `
      ${bodyParagraph(`Olá, <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.producerName)}</b></font>.`)}
      ${bodyParagraph(
        `<font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.participantName)}</b></font> enviou uma solicitação para participar de <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.eventTitle)}</b></font>.`,
      )}
      ${bodyParagraph(
        "Revise os dados abaixo e aprove ou recuse pelo painel do evento quando estiver pronto.",
      )}
      ${renderEmailInfoCardGroup([
        { label: "Participante", value: escapeHtml(data.participantName) },
        { label: "E-mail", value: escapeHtml(data.participantEmail) },
      ])}
      ${phoneRow}
    `,
    cta: {
      label: "Revisar solicitações",
      href: manageUrl,
    },
    footerNote:
      "A aprovação continua sendo feita na guia de solicitações do evento. Este e-mail é apenas um aviso.",
  });
}

export type PasswordResetEmailTemplateData = {
  userName: string;
  resetUrl: string;
};

export function buildPasswordResetEmail(data: PasswordResetEmailTemplateData): string {
  return renderEmailLayout({
    preheader: "Use o link abaixo para redefinir sua senha com segurança.",
    eyebrow: "Segurança da conta",
    title: "Redefinir senha",
    bodyHtml: `
      ${bodyParagraph(`Olá, <font color="${EMAIL_BRAND.text}"><b>${escapeHtml(data.userName)}</b></font>.`)}
      ${bodyParagraph(
        "Recebemos uma solicitação para redefinir a senha da sua conta. Se foi você, use o botão abaixo. O link expira em 1 hora.",
      )}
      ${bodyParagraph(
        "Se você não solicitou esta alteração, ignore este e-mail. Sua senha atual continuará válida.",
      )}
    `,
    cta: {
      label: "Redefinir senha",
      href: data.resetUrl,
    },
    footerNote:
      "Por segurança, após redefinir a senha todas as sessões anteriores serão encerradas.",
  });
}
