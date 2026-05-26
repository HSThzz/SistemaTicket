import dotenv from "dotenv";
import path from "node:path";

dotenv.config();

function requireEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (value === undefined || value === "") {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? "3000"),
  logLevel: process.env.LOG_LEVEL ?? "info",
  payment: {
    webhookSecret: process.env.PAYMENT_WEBHOOK_SECRET ?? "",
  },
  jwt: {
    secret: requireEnv("JWT_SECRET", "dev-secret-change-in-production"),
    expiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  },
  db: {
    host: requireEnv("DB_HOST", "localhost"),
    port: Number(process.env.DB_PORT ?? "5432"),
    username: requireEnv("DB_USERNAME", "postgres"),
    password: requireEnv("DB_PASSWORD", "postgres"),
    database: requireEnv("DB_DATABASE", "app_db"),
  },
  redis: {
    host: requireEnv("REDIS_HOST", "localhost"),
    port: Number(process.env.REDIS_PORT ?? "6379"),
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
      issuerId: process.env.GOOGLE_WALLET_ISSUER_ID ?? "",
      origins: (process.env.GOOGLE_WALLET_ORIGINS ?? "http://localhost:3000")
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
  },
} as const;

export const isProduction = env.nodeEnv === "production";
