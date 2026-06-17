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

const RESPONSIVE_STYLES = `
  body, table, td, p, a, li, blockquote {
    -webkit-text-size-adjust: 100%;
    -ms-text-size-adjust: 100%;
  }
  table, td {
    mso-table-lspace: 0pt;
    mso-table-rspace: 0pt;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    outline: none;
    text-decoration: none;
  }
  @media only screen and (max-width: 620px) {
    .email-shell {
      width: 100% !important;
      border-radius: 0 !important;
    }
    .email-outer-padding {
      padding: 16px 8px !important;
    }
    .email-header,
    .email-body,
    .email-footer,
    .email-cta-wrap {
      padding-left: 16px !important;
      padding-right: 16px !important;
    }
    .email-title {
      font-size: 22px !important;
      line-height: 1.25 !important;
    }
    .email-brand {
      font-size: 24px !important;
    }
    .email-cta-link {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      text-align: center !important;
    }
  }
`;

/**
 * Monta HTML compatível com Gmail/Outlook mobile (tabelas + CSS inline).
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
        <td class="email-cta-wrap" style="padding: 4px 28px 0; font-family: ${EMAIL_BRAND.font};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
            <tr>
              <td align="left">
                <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${options.cta.href}" style="height:46px;v-text-anchor:middle;width:220px;" arcsize="50%" strokecolor="${EMAIL_BRAND.green}" fillcolor="${EMAIL_BRAND.green}">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${options.cta.label}</center>
                  </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a
                  class="email-cta-link"
                  href="${options.cta.href}"
                  style="
                    display: inline-block;
                    background-color: ${EMAIL_BRAND.green};
                    color: #ffffff !important;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 700;
                    line-height: 1.2;
                    padding: 14px 22px;
                    border-radius: 999px;
                    mso-hide: all;
                  "
                >${options.cta.label}</a>
                <!--<![endif]-->
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : "";

  return `<!DOCTYPE html>
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${options.title}</title>
    <style type="text/css">${RESPONSIVE_STYLES}</style>
  </head>
  <body style="margin:0;padding:0;width:100% !important;background-color:${EMAIL_BRAND.canvas};font-family:${EMAIL_BRAND.font};">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${preheader}
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:${EMAIL_BRAND.canvas};">
      <tr>
        <td class="email-outer-padding" align="center" style="padding:24px 12px;">
          <table
            role="presentation"
            class="email-shell"
            width="600"
            cellspacing="0"
            cellpadding="0"
            border="0"
            style="width:100%;max-width:600px;background-color:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;overflow:hidden;"
          >
            <tr>
              <td
                class="email-header"
                style="padding:24px 28px;background-color:${EMAIL_BRAND.dark};font-family:${EMAIL_BRAND.font};"
              >
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 0 8px;font-size:11px;line-height:1.4;letter-spacing:0.18em;text-transform:uppercase;color:${EMAIL_BRAND.greenBright};font-weight:700;">
                      ${eyebrow}
                    </td>
                  </tr>
                  <tr>
                    <td class="email-brand" style="font-size:28px;line-height:1.1;color:#ffffff;font-weight:800;letter-spacing:-0.03em;">
                      ${EMAIL_BRAND.name}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-body" style="padding:28px 28px 8px;font-family:${EMAIL_BRAND.font};color:${EMAIL_BRAND.text};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td class="email-title" style="padding:0 0 14px;font-size:24px;line-height:1.25;font-weight:800;color:${EMAIL_BRAND.text};">
                      ${options.title}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:15px;line-height:1.7;color:${EMAIL_BRAND.textMuted};">
                      ${options.bodyHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td class="email-footer" style="padding:24px 28px 28px;font-family:${EMAIL_BRAND.font};font-size:12px;line-height:1.6;color:${EMAIL_BRAND.textSoft};">
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:16px 0 0;background-color:${EMAIL_BRAND.greenSoft};border:1px solid #bbf7d0;border-radius:12px;">
      <tr>
        <td style="padding:14px 16px;font-family:${EMAIL_BRAND.font};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td style="padding:0 0 6px;font-size:11px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.green};font-weight:700;">
                ${label}
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:1.5;color:${EMAIL_BRAND.text};font-weight:600;word-break:break-word;">
                ${value}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;
}

export type EmailDataField = {
  label: string;
  value: string;
};

/** Lista de campos empilhados — funciona bem em Gmail mobile sem colunas fixas. */
export function renderEmailDataList(fields: EmailDataField[]): string {
  const rows = fields
    .map(
      (field) => `
        <tr>
          <td style="padding:14px 0 0;font-size:11px;line-height:1.4;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.textSoft};font-weight:700;font-family:${EMAIL_BRAND.font};">
            ${field.label}
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0 14px;font-size:15px;line-height:1.5;color:${EMAIL_BRAND.text};font-weight:600;word-break:break-word;border-bottom:1px solid ${EMAIL_BRAND.border};font-family:${EMAIL_BRAND.font};">
            ${field.value}
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;">
      ${rows}
    </table>
  `;
}
