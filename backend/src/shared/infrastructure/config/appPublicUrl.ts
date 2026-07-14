/**
 * @file URL pública do frontend (links em e-mails e resets).
 * @module shared/infrastructure/config/appPublicUrl
 */

const PRODUCTION_APP_URL = "https://vibraevents.com.br";
const LOCAL_APP_URL = "http://127.0.0.1:5173";

/**
 * Base URL do site (sem barra final).
 * Preferência: `APP_PUBLIC_URL` → produção padrão → CORS → localhost.
 */
export function getAppPublicUrl(): string {
  const configured = process.env.APP_PUBLIC_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  if ((process.env.NODE_ENV ?? "development") === "production") {
    return PRODUCTION_APP_URL;
  }

  const corsOrigin = process.env.CORS_ORIGINS?.split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .find(Boolean);

  return corsOrigin ?? LOCAL_APP_URL;
}
