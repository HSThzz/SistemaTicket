/**
 * @file Layout HTML reutilizável para e-mails transacionais VIBRA.
 * @module modules/notifications/infrastructure/email/renderEmailLayout
 */

import { EMAIL_BRAND } from "./emailBrand";

export type EmailCta = {
  label: string;
  href: string;
};

export type EmailLayoutOptions = {
  preheader?: string;
  eyebrow?: string;
  title: string;
  bodyHtml: string;
  cta?: EmailCta;
  footerNote?: string;
};

/**
 * Monta HTML responsivo compatível com clientes de e-mail (tabelas + inline CSS).
 */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const preheader = options.preheader ?? options.title;
  const eyebrow = options.eyebrow ?? EMAIL_BRAND.product;
  const footerNote =
    options.footerNote ??
    `Você está recebendo este e-mail porque interagiu com a ${EMAIL_BRAND.name}.`;

  const ctaBlock = options.cta
    ? `
      <tr>
        <td style="padding: 8px 32px 0;">
          <a
            href="${options.cta.href}"
            style="
              display: inline-block;
              background: ${EMAIL_BRAND.green};
              color: #ffffff;
              text-decoration: none;
              font-size: 14px;
              font-weight: 700;
              line-height: 1;
              padding: 14px 24px;
              border-radius: 999px;
            "
          >${options.cta.label}</a>
        </td>
      </tr>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <title>${options.title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Unbounded:wght@700;900&display=swap"
      rel="stylesheet"
    />
  </head>
  <body style="margin: 0; padding: 0; background: ${EMAIL_BRAND.canvas};">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0; color:transparent;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${EMAIL_BRAND.canvas}; padding: 32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; background: ${EMAIL_BRAND.surface}; border: 1px solid ${EMAIL_BRAND.border}; border-radius: 20px; overflow: hidden; box-shadow: 0 18px 50px rgba(5, 46, 22, 0.08);">
            <tr>
              <td style="background: linear-gradient(135deg, ${EMAIL_BRAND.dark} 0%, #0f3d22 100%); padding: 28px 32px;">
                <div style="font-family: ${EMAIL_BRAND.fontDisplay}; font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: ${EMAIL_BRAND.greenBright}; font-weight: 700; margin-bottom: 10px;">
                  ${eyebrow}
                </div>
                <div style="font-family: ${EMAIL_BRAND.fontDisplay}; font-size: 28px; line-height: 1.1; color: #ffffff; font-weight: 900; letter-spacing: -0.04em;">
                  ${EMAIL_BRAND.name}
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding: 32px 32px 8px; font-family: ${EMAIL_BRAND.font}; color: ${EMAIL_BRAND.text};">
                <h1 style="margin: 0 0 16px; font-family: ${EMAIL_BRAND.fontDisplay}; font-size: 24px; line-height: 1.2; letter-spacing: -0.03em; color: ${EMAIL_BRAND.text};">
                  ${options.title}
                </h1>
                <div style="font-size: 15px; line-height: 1.7; color: ${EMAIL_BRAND.textMuted};">
                  ${options.bodyHtml}
                </div>
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td style="padding: 28px 32px 32px; font-family: ${EMAIL_BRAND.font}; font-size: 12px; line-height: 1.6; color: ${EMAIL_BRAND.textSoft};">
                ${footerNote}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function renderEmailInfoCard(label: string, value: string): string {
  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 18px 0 0; background: ${EMAIL_BRAND.greenSoft}; border: 1px solid rgba(22, 163, 74, 0.18); border-radius: 14px;">
      <tr>
        <td style="padding: 16px 18px; font-family: ${EMAIL_BRAND.font};">
          <div style="font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${EMAIL_BRAND.green}; font-weight: 700; margin-bottom: 6px;">
            ${label}
          </div>
          <div style="font-size: 15px; line-height: 1.5; color: ${EMAIL_BRAND.text}; font-weight: 600;">
            ${value}
          </div>
        </td>
      </tr>
    </table>
  `;
}
