/**
 * @file Carregamento e validação de variáveis de ambiente da aplicação.
 * @module shared/infrastructure/config/env
 */

import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

/**
 * Exige que uma variável de ambiente esteja definida e não vazia.
 * @param key - Nome da variável.
 * @param fallback - Valor padrão opcional.
 * @returns Valor da variável.
 * @throws {Error} Quando a variável está ausente e não há fallback.
 */
function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

const defaultCorsOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

/** Configuração tipada e imutável derivada do ambiente de execução. */
export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? "3000"),
  logLevel: process.env.LOG_LEVEL ?? "info",
  corsOrigins: (process.env.CORS_ORIGINS ?? defaultCorsOrigins.join(","))
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean),
  payment: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "",
    webhookMaxAgeSeconds: Number(process.env.WEBHOOK_MAX_AGE_SECONDS ?? "300"),
    gateway: (process.env.PAYMENT_GATEWAY ?? "simulated") as
      | "simulated"
      | "mercadopago",
    mercadoPago: {
      accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN ?? "",
      /** Chave pública para tokenização de cartão no front-end (painel MP > Credenciais de teste). */
      publicKey: process.env.MERCADOPAGO_PUBLIC_KEY ?? "",
      webhookSecret: process.env.MERCADOPAGO_WEBHOOK_SECRET ?? "",
      apiBaseUrl:
        process.env.MERCADOPAGO_API_BASE_URL ?? "https://api.mercadopago.com",
      notificationUrl: process.env.MERCADOPAGO_NOTIFICATION_URL ?? "",
      /** E-mail de comprador de teste do painel MP (fallback quando o usuário tem e-mail .test etc.). */
      testPayerEmail: process.env.MERCADOPAGO_TEST_PAYER_EMAIL ?? "",
      /** CPF de comprador de teste (fallback quando o documento do usuário é inválido). */
      testPayerDocument: process.env.MERCADOPAGO_TEST_PAYER_DOCUMENT ?? "",
    },
  },
  jwt: {
    secret: requireEnv("JWT_SECRET", "dev-secret-change-in-production"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "1d",
  },
  db: {
    url: process.env.DATABASE_URL ?? "",
    host: process.env.DB_HOST ?? "localhost",
    port: Number(process.env.DB_PORT ?? "5432"),
    username: process.env.DB_USERNAME ?? "postgres",
    password: process.env.DB_PASSWORD ?? "postgres",
    database: process.env.DB_DATABASE ?? "app_db",
  },
  redis: {
    url: process.env.REDIS_URL ?? "",
    host: process.env.REDIS_HOST ?? "localhost",
    port: Number(process.env.REDIS_PORT ?? "6379"),
    db: Number(process.env.REDIS_DB ?? "0"),
  },
  /** Intervalo do job de reconciliação Redis ↔ PostgreSQL (0 = desligado). */
  stockReconciliationIntervalMs: Number(
    process.env.STOCK_RECONCILIATION_INTERVAL_MS ?? "300000",
  ),
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID ?? "",
    clientSecret: process.env.SPOTIFY_CLIENT_SECRET ?? "",
    redirectUri:
      process.env.SPOTIFY_REDIRECT_URI ?? "http://127.0.0.1:3000/auth/spotify/callback",
    frontendReturnUrl:
      process.env.SPOTIFY_FRONTEND_RETURN_URL ?? "http://127.0.0.1:5173/eventos",
  },
  wallet: {
    apple: {
      wwdrCertPath: process.env.APPLE_WWDR_CERT_PATH ?? "",
      signerCertPath: process.env.APPLE_SIGNER_CERT_PATH ?? "",
      signerKeyPath: process.env.APPLE_SIGNER_KEY_PATH ?? "",
      signerKeyPassphrase: process.env.APPLE_SIGNER_KEY_PASSPHRASE ?? "",
      teamId: process.env.APPLE_TEAM_ID ?? "",
      passTypeIdentifier: process.env.APPLE_PASS_TYPE_IDENTIFIER ?? "",
      organizationName: process.env.APPLE_ORGANIZATION_NAME ?? "Tickets",
      passModelPath:
        process.env.APPLE_PASS_MODEL_PATH ??
        path.resolve(process.cwd(), "assets", "event.pass"),
    },
    google: {
      credentialsPath: process.env.GOOGLE_WALLET_CREDENTIALS_PATH ?? "",
      /** JSON completo da service account (alternativa ao arquivo — use no Railway). */
      credentialsJson: process.env.GOOGLE_WALLET_CREDENTIALS_JSON ?? "",
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID ?? "",
      issuerName: process.env.GOOGLE_WALLET_ISSUER_NAME ?? "VIBRA",
      origins: (process.env.GOOGLE_WALLET_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
  },
} as const;

/** Indica se credenciais Spotify estão configuradas. */
export function isSpotifyConfigured(): boolean {
  return Boolean(env.spotify.clientId.trim() && env.spotify.clientSecret.trim());
}

/** Indica se a aplicação está em modo produção. */
export const isProduction = env.nodeEnv === "production";

/** Credenciais Mercado Pago de sandbox (token `TEST-...`). */
export function isMercadoPagoSandbox(): boolean {
  return env.payment.mercadoPago.accessToken.trim().startsWith("TEST-");
}

const DEV_JWT_FALLBACK = "dev-secret-change-in-production";

/**
 * Valida variáveis críticas antes de subir em produção.
 * @throws {Error} Quando algum segredo obrigatório estiver ausente ou inseguro.
 */
export function validateProductionConfig(): void {
  if (!isProduction) {
    return;
  }

  const errors: string[] = [];

  if (env.jwt.secret === DEV_JWT_FALLBACK) {
    errors.push("JWT_SECRET must be set to a strong value in production");
  }

  if (!env.payment.webhookSecret.trim()) {
    errors.push("PAYMENT_WEBHOOK_SECRET is required in production");
  }

  if (env.payment.gateway === "mercadopago") {
    if (!env.payment.mercadoPago.accessToken.trim()) {
      errors.push("MERCADOPAGO_ACCESS_TOKEN is required when PAYMENT_GATEWAY=mercadopago");
    }
    if (!env.payment.mercadoPago.webhookSecret.trim() && !isMercadoPagoSandbox()) {
      errors.push(
        "MERCADOPAGO_WEBHOOK_SECRET is required when PAYMENT_GATEWAY=mercadopago (except sandbox TEST- token)",
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(`Production configuration invalid:\n- ${errors.join("\n- ")}`);
  }
}
