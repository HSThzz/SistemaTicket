/**
 * @file URL pública da API (webhooks, assets estáticos para Google Wallet).
 * @module shared/infrastructure/config/apiPublicUrl
 */

import { env } from "./env";

/**
 * Base URL HTTPS da API (sem barra final).
 * Preferência: `API_PUBLIC_URL` → origem do webhook MP → `RAILWAY_PUBLIC_DOMAIN`.
 */
export function getApiPublicUrl(): string | undefined {
  const configured = process.env.API_PUBLIC_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const webhook = env.payment.mercadoPago.notificationUrl.trim();
  if (webhook) {
    try {
      const url = new URL(webhook);
      if (url.protocol === "https:") {
        return `${url.protocol}//${url.host}`;
      }
    } catch {
      // ignore
    }
  }

  const railwayDomain = process.env.RAILWAY_PUBLIC_DOMAIN?.trim();
  if (railwayDomain) {
    const host = railwayDomain.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
    return `https://${host}`;
  }

  // Origins do Wallet às vezes incluem a API (Railway).
  const apiLooking = env.wallet.google.origins.find(
    (origin) =>
      /^https:\/\//i.test(origin) &&
      (/railway\.app$/i.test(origin) || /\/api/i.test(origin)),
  );
  if (apiLooking) {
    return apiLooking.replace(/\/+$/, "");
  }

  return undefined;
}
