/**
 * @file Layout HTML reutilizável para e-mails transacionais VIBRA.
 * @module modules/notifications/infrastructure/email/renderEmailLayout
 *
 * Estratégia bulletproof: 100% tabelas + bgcolor + <font>.
 * Gmail mobile ignora display:block, <style> e backgrounds em <a>.
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

const F = EMAIL_BRAND.font;
const FM = EMAIL_BRAND.fontMono;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeHtmlAttr(value: string): string {
  return escapeHtml(value);
}

function spacerRow(height: number, bg = EMAIL_BRAND.surface): string {
  return `
    <tr>
      <td height="${height}" bgcolor="${bg}" style="height:${height}px;line-height:${height}px;font-size:1px;background-color:${bg};">&nbsp;</td>
    </tr>
  `;
}

/**
 * Botão Gmail-safe: padding simulado com border no <a>.
 * @see https://www.emailonacid.com/blog/article/email-development/building-a-bulletproof-button-with-vml/
 */
function renderBulletproofButton(href: string, label: string): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td
          align="center"
          bgcolor="${EMAIL_BRAND.green}"
          style="background-color:${EMAIL_BRAND.green};padding:16px 40px;"
        >
          <a
            href="${escapeHtmlAttr(href)}"
            target="_blank"
            rel="noopener noreferrer"
            style="color:#ffffff;font-family:${F};font-size:16px;font-weight:bold;text-decoration:none;"
          ><font face="${F}" color="#ffffff">${escapeHtml(label)}</font></a>
        </td>
      </tr>
    </table>
  `;
}

/** Label e valor em linhas separadas — Gmail mobile não respeita display:block em span. */
function renderInfoFieldRows(
  label: string,
  value: string,
  options: { mono?: boolean; isFirst?: boolean; isLast?: boolean } = {},
): string {
  const labelPadTop = options.isFirst ? "18px" : "16px";
  const valuePadBottom = options.isLast ? "18px" : "14px";
  const valueFace = options.mono ? FM : F;
  const valueSize = options.mono ? "12px" : "16px";

  return `
    <tr>
      <td bgcolor="${EMAIL_BRAND.dataPanel}" style="padding:${labelPadTop} 20px 6px;background-color:${EMAIL_BRAND.dataPanel};font-family:${F};">
        <font face="${F}" color="${EMAIL_BRAND.labelAccent}" style="font-size:10px;font-weight:bold;letter-spacing:1px;">
          ${label.toUpperCase()}
        </font>
      </td>
    </tr>
    <tr>
      <td bgcolor="${EMAIL_BRAND.dataPanel}" style="padding:0 20px ${valuePadBottom};background-color:${EMAIL_BRAND.dataPanel};font-family:${valueFace};">
        <font face="${valueFace}" color="${EMAIL_BRAND.text}" style="font-size:${valueSize};font-weight:bold;word-wrap:break-word;word-break:break-all;">
          ${value}
        </font>
      </td>
    </tr>
  `;
}

export function renderEmailLayout(options: EmailLayoutOptions): string {
  const preheader = escapeHtml(options.preheader ?? options.title);
  const eyebrow = escapeHtml(options.eyebrow ?? EMAIL_BRAND.product);
  const title = escapeHtml(options.title);
  const footerNote = escapeHtml(
    options.footerNote ??
      `Você está recebendo este e-mail porque interagiu com a ${EMAIL_BRAND.name}.`,
  );

  const ctaBlock = options.cta
    ? `
      ${spacerRow(12)}
      <tr>
        <td align="center" bgcolor="${EMAIL_BRAND.surface}" style="padding:8px 24px;background-color:${EMAIL_BRAND.surface};">
          ${renderBulletproofButton(options.cta.href, options.cta.label)}
        </td>
      </tr>
      ${spacerRow(20)}
    `
    : "";

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="format-detection" content="telephone=no,date=no,address=no,email=no" />
    <title>${title}</title>
  </head>
  <body bgcolor="${EMAIL_BRAND.surface}" style="margin:0;padding:0;background-color:${EMAIL_BRAND.surface};font-family:${F};">
    <div style="display:none;max-height:0;overflow:hidden;">${preheader}</div>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
      <tr>
        <td align="center" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" bgcolor="${EMAIL_BRAND.surface}" style="width:100%;max-width:600px;background-color:${EMAIL_BRAND.surface};border:1px solid ${EMAIL_BRAND.border};">
            <tr>
              <td bgcolor="${EMAIL_BRAND.dark}" style="padding:32px 24px;background-color:${EMAIL_BRAND.dark};">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.dark}" style="background-color:${EMAIL_BRAND.dark};">
                  <tr>
                    <td bgcolor="${EMAIL_BRAND.dark}" style="padding:0 0 12px;background-color:${EMAIL_BRAND.dark};">
                      <font face="${F}" color="${EMAIL_BRAND.greenMuted}" style="font-size:11px;letter-spacing:1px;font-weight:normal;">
                        ${eyebrow.toUpperCase()}
                      </font>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="${EMAIL_BRAND.dark}" style="padding:0 0 8px;background-color:${EMAIL_BRAND.dark};">
                      <font face="${F}" color="#ffffff" style="font-size:32px;font-weight:bold;">
                        ${EMAIL_BRAND.name}
                      </font>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="${EMAIL_BRAND.dark}" style="background-color:${EMAIL_BRAND.dark};">
                      <font face="${F}" color="${EMAIL_BRAND.greenSoft}" style="font-size:14px;">
                        Ingressos
                      </font>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td bgcolor="${EMAIL_BRAND.surface}" style="padding:28px 24px 0;background-color:${EMAIL_BRAND.surface};">
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
                  <tr>
                    <td bgcolor="${EMAIL_BRAND.surface}" style="padding:0 0 16px;background-color:${EMAIL_BRAND.surface};">
                      <font face="${F}" color="${EMAIL_BRAND.text}" style="font-size:24px;font-weight:bold;">
                        ${title}
                      </font>
                    </td>
                  </tr>
                  <tr>
                    <td bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};font-family:${F};">
                      ${options.bodyHtml}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ${ctaBlock}
            <tr>
              <td bgcolor="${EMAIL_BRAND.surface}" style="padding:0 24px 36px;background-color:${EMAIL_BRAND.surface};">
                <font face="${F}" color="${EMAIL_BRAND.textSoft}" style="font-size:13px;line-height:1.6;">
                  ${footerNote}
                </font>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export type EmailInfoCardOptions = {
  mono?: boolean;
};

export function renderEmailInfoCard(
  label: string,
  value: string,
  options: EmailInfoCardOptions = {},
): string {
  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
      ${spacerRow(16, EMAIL_BRAND.surface)}
      <tr>
        <td bgcolor="${EMAIL_BRAND.dataPanelBorder}" style="padding:1px;background-color:${EMAIL_BRAND.dataPanelBorder};">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.dataPanel}" style="background-color:${EMAIL_BRAND.dataPanel};">
            ${renderInfoFieldRows(label, value, { mono: options.mono, isFirst: true, isLast: true })}
          </table>
        </td>
      </tr>
    </table>
  `;
}

export type EmailInfoCardItem = {
  label: string;
  value: string;
  mono?: boolean;
};

export function renderEmailInfoCardGroup(items: EmailInfoCardItem[]): string {
  const rows = items
    .map((item, index) => {
      const divider =
        index === 0
          ? ""
          : `
        <tr>
          <td height="1" bgcolor="${EMAIL_BRAND.dataDivider}" style="height:1px;font-size:1px;line-height:1px;background-color:${EMAIL_BRAND.dataDivider};">&nbsp;</td>
        </tr>
      `;

      return `
        ${divider}
        ${renderInfoFieldRows(item.label, item.value, {
          mono: item.mono,
          isFirst: index === 0,
          isLast: index === items.length - 1,
        })}
      `;
    })
    .join("");

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
      ${spacerRow(16, EMAIL_BRAND.surface)}
      <tr>
        <td bgcolor="${EMAIL_BRAND.dataPanelBorder}" style="padding:1px;background-color:${EMAIL_BRAND.dataPanelBorder};">
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.dataPanel}" style="background-color:${EMAIL_BRAND.dataPanel};">
            ${rows}
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

export function renderEmailDataList(fields: EmailDataField[]): string {
  const rows = fields
    .map(
      (field, index) => `
        <tr>
          <td bgcolor="${EMAIL_BRAND.surface}" style="padding:${index === 0 ? "4px" : "16px"} 0 0;background-color:${EMAIL_BRAND.surface};">
            <font face="${F}" color="${EMAIL_BRAND.textSoft}" style="font-size:11px;font-weight:bold;letter-spacing:1px;">
              ${field.label.toUpperCase()}
            </font>
          </td>
        </tr>
        <tr>
          <td bgcolor="${EMAIL_BRAND.surface}" style="padding:6px 0 16px;background-color:${EMAIL_BRAND.surface};border-bottom:1px solid ${EMAIL_BRAND.border};">
            <font face="${F}" color="${EMAIL_BRAND.text}" style="font-size:16px;font-weight:bold;">
              ${field.value}
            </font>
          </td>
        </tr>
      `,
    )
    .join("");

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${EMAIL_BRAND.surface}" style="background-color:${EMAIL_BRAND.surface};">
      ${rows}
    </table>
  `;
}
