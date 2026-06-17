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
    border-collapse: collapse;
  }
  img {
    -ms-interpolation-mode: bicubic;
    border: 0;
    outline: none;
    text-decoration: none;
  }
  a[x-apple-data-detectors] {
    color: inherit !important;
    text-decoration: none !important;
    font-size: inherit !important;
    font-family: inherit !important;
    font-weight: inherit !important;
    line-height: inherit !important;
  }
  @media only screen and (max-width: 620px) {
    .email-shell {
      width: 100% !important;
      max-width: 100% !important;
      border-radius: 0 !important;
    }
    .email-outer-padding {
      padding: 12px 0 !important;
    }
    .email-header,
    .email-body,
    .email-footer,
    .email-cta-wrap {
      padding-left: 20px !important;
      padding-right: 20px !important;
    }
    .email-title {
      font-size: 22px !important;
      line-height: 1.3 !important;
    }
    .email-brand {
      font-size: 26px !important;
    }
    .email-cta-link {
      display: block !important;
      width: 100% !important;
      box-sizing: border-box !important;
      text-align: center !important;
    }
    .email-info-card-cell {
      padding: 18px 18px !important;
    }
  }
`;

/** Espaçador vertical compatível com Gmail (margin é ignorado). */
function renderSpacer(height: number): string {
  return `
    <tr>
      <td height="${height}" style="height:${height}px;font-size:0;line-height:0;mso-line-height-rule:exactly;">&nbsp;</td>
    </tr>
  `;
}

/**
 * Monta HTML compatível com Gmail/Outlook mobile (tabelas + CSS inline + bgcolor).
 */
export function renderEmailLayout(options: EmailLayoutOptions): string {
  const preheader = options.preheader ?? options.title;
  const eyebrow = options.eyebrow ?? EMAIL_BRAND.product;
  const footerNote =
    options.footerNote ??
    `Você está recebendo este e-mail porque interagiu com a ${EMAIL_BRAND.name}.`;

  const ctaBlock = options.cta
    ? `
      ${renderSpacer(20)}
      <tr>
        <td class="email-cta-wrap" align="left" bgcolor="${EMAIL_BRAND.surface}" style="padding:0 32px;background-color:${EMAIL_BRAND.surface};font-family:${EMAIL_BRAND.font};">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td align="left">
                <!--[if mso]>
                  <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${options.cta.href}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="50%" strokecolor="${EMAIL_BRAND.green}" fillcolor="${EMAIL_BRAND.green}">
                    <w:anchorlock/>
                    <center style="color:#ffffff;font-family:sans-serif;font-size:14px;font-weight:bold;">${options.cta.label}</center>
                  </v:roundrect>
                <![endif]-->
                <!--[if !mso]><!-->
                <a
                  class="email-cta-link"
                  href="${options.cta.href}"
                  style="
                    display:inline-block;
                    background-color:${EMAIL_BRAND.green};
                    color:#ffffff !important;
                    text-decoration:none;
                    font-size:15px;
                    font-weight:700;
                    line-height:1.2;
                    padding:15px 28px;
                    border-radius:999px;
                    mso-hide:all;
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
<html lang="pt-BR" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
    <meta name="color-scheme" content="light only" />
    <meta name="supported-color-schemes" content="light" />
    <title>${options.title}</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <style type="text/css">${RESPONSIVE_STYLES}</style>
  </head>
  <body bgcolor="${EMAIL_BRAND.canvas}" style="margin:0;padding:0;width:100% !important;min-width:100%;background-color:${EMAIL_BRAND.canvas};font-family:${EMAIL_BRAND.font};">
    <div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">
      ${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="${EMAIL_BRAND.canvas}" style="background-color:${EMAIL_BRAND.canvas};">
      <tr>
        <td class="email-outer-padding" align="center" bgcolor="${EMAIL_BRAND.canvas}" style="padding:32px 16px;background-color:${EMAIL_BRAND.canvas};">
          <table
            role="presentation"
            class="email-shell"
            width="600"
            cellspacing="0"
            cellpadding="0"
            border="0"
            align="center"
            bgcolor="${EMAIL_BRAND.surface}"
            style="width:100%;max-width:600px;background-color:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};border-radius:16px;"
          >
            <tr>
              <td
                class="email-header"
                align="left"
                bgcolor="${EMAIL_BRAND.dark}"
                style="padding:28px 32px;background-color:${EMAIL_BRAND.dark};font-family:${EMAIL_BRAND.font};border-radius:16px 16px 0 0;"
              >
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 0 10px;font-size:11px;line-height:1.4;letter-spacing:0.16em;text-transform:uppercase;color:${EMAIL_BRAND.greenBright};font-weight:700;font-family:${EMAIL_BRAND.font};">
                      ${eyebrow}
                    </td>
                  </tr>
                  <tr>
                    <td class="email-brand" style="font-size:30px;line-height:1.1;color:#ffffff;font-weight:800;letter-spacing:-0.02em;font-family:${EMAIL_BRAND.font};">
                      ${EMAIL_BRAND.name}
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0 0;font-size:13px;line-height:1.4;color:${EMAIL_BRAND.greenSoft};font-family:${EMAIL_BRAND.font};">
                      Ingressos
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td class="email-body" align="left" bgcolor="${EMAIL_BRAND.surface}" style="padding:32px 32px 8px;background-color:${EMAIL_BRAND.surface};font-family:${EMAIL_BRAND.font};color:${EMAIL_BRAND.text};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td class="email-title" style="padding:0 0 18px;font-size:26px;line-height:1.3;font-weight:800;color:${EMAIL_BRAND.text};font-family:${EMAIL_BRAND.font};">
                      ${options.title}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:16px;line-height:1.75;color:${EMAIL_BRAND.textMuted};font-family:${EMAIL_BRAND.font};">
                      ${options.bodyHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td class="email-footer" align="left" bgcolor="${EMAIL_BRAND.surface}" style="padding:20px 32px 32px;font-family:${EMAIL_BRAND.font};font-size:13px;line-height:1.65;color:${EMAIL_BRAND.textSoft};background-color:${EMAIL_BRAND.surface};border-radius:0 0 16px 16px;">
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
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${renderSpacer(16)}
      <tr>
        <td bgcolor="${EMAIL_BRAND.greenSoft}" style="background-color:${EMAIL_BRAND.greenSoft};border:1px solid #bbf7d0;border-radius:12px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
            <tr>
              <td class="email-info-card-cell" style="padding:20px 22px;font-family:${EMAIL_BRAND.font};">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                  <tr>
                    <td style="padding:0 0 8px;font-size:11px;line-height:1.4;letter-spacing:0.12em;text-transform:uppercase;color:${EMAIL_BRAND.green};font-weight:700;font-family:${EMAIL_BRAND.font};">
                      ${label}
                    </td>
                  </tr>
                  <tr>
                    <td style="font-size:16px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:600;word-break:break-word;font-family:${EMAIL_BRAND.font};">
                      <span style="color:${EMAIL_BRAND.text};text-decoration:none;">${value}</span>
                    </td>
                  </tr>
                </table>
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
      (field, index) => `
        <tr>
          <td style="padding:${index === 0 ? "8px" : "20px"} 0 0;font-size:11px;line-height:1.4;letter-spacing:0.1em;text-transform:uppercase;color:${EMAIL_BRAND.textSoft};font-weight:700;font-family:${EMAIL_BRAND.font};">
            ${field.label}
          </td>
        </tr>
        <tr>
          <td style="padding:8px 0 20px;font-size:16px;line-height:1.55;color:${EMAIL_BRAND.text};font-weight:600;word-break:break-word;border-bottom:1px solid ${EMAIL_BRAND.border};font-family:${EMAIL_BRAND.font};">
            <span style="color:${EMAIL_BRAND.text};text-decoration:none;">${field.value}</span>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin-top:4px;">
      ${rows}
    </table>
  `;
}
