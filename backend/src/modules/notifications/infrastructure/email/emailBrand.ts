/**
 * @file Tokens visuais da marca VIBRA para e-mails transacionais.
 * @module modules/notifications/infrastructure/email/emailBrand
 */

export const EMAIL_BRAND = {
  name: "VIBRA",
  product: "Ingressos",
  green: "#16a34a",
  greenBright: "#22c55e",
  greenSoft: "#dcfce7",
  dark: "#052e16",
  text: "#111111",
  textMuted: "#555555",
  textSoft: "#737373",
  surface: "#ffffff",
  canvas: "#f5f5f3",
  border: "#e0e0dc",
  /** Fontes de sistema — Gmail mobile ignora Google Fonts. */
  font:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
} as const;
