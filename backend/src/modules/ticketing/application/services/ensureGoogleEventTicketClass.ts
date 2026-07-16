/**
 * @file Garante que a EventTicketClass existe na API do Google Wallet.
 * @module ticketing/application/services/ensureGoogleEventTicketClass
 */

import { google } from "googleapis";
import { getApiPublicUrl } from "../../../../shared/infrastructure/config/apiPublicUrl";
import { getAppPublicUrl } from "../../../../shared/infrastructure/config/appPublicUrl";
import { env } from "../../../../shared/infrastructure/config/env";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { WalletConfigError } from "../../domain/errors/WalletError";
import { loadGoogleCredentials } from "../helpers/walletHelpers";

const CONTEXT = "ensureGoogleEventTicketClass";
const logger = Logger.getInstance();

/** Cor de fundo do card (API só aceita cor sólida). */
const GOOGLE_WALLET_BACKGROUND_COLOR = "#000000";

/** Asset do frontend: faixa larga (`frontend/public/wallet/vibra-hero.png`). */
const FRONTEND_HERO_PATH = "/wallet/vibra-hero.png";

/** Logo quadrada para o ícone circular (`frontend/public/wallet/vibra-logo.png`). */
const FRONTEND_LOGO_PATH = "/wallet/vibra-logo.png";

/** Fallbacks servidos pela API. */
const API_HERO_PATH = "/wallet-assets/vibra-hero.png";
const API_LOGO_PATH = "/wallet-assets/vibra-logo.png";

function getIssuerDisplayName(): string {
  return env.wallet.google.issuerName.trim() || "VIBRA";
}

function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value);
}

function joinPublicUrl(base: string, path: string): string {
  return `${base.replace(/\/+$/, "")}${path}`;
}

type BrandImageUrls = {
  heroUrl?: string;
  logoUrl?: string;
};

/**
 * URLs HTTPS da marca.
 * Preferência: env (hero) → frontend public → API static.
 */
function resolveBrandImageUrls(): BrandImageUrls {
  const configured = env.wallet.google.heroImageUrl.trim();
  if (configured && isHttpsUrl(configured)) {
    return { heroUrl: configured, logoUrl: configured };
  }

  const appPublicUrl = getAppPublicUrl();
  if (isHttpsUrl(appPublicUrl)) {
    return {
      heroUrl: joinPublicUrl(appPublicUrl, FRONTEND_HERO_PATH),
      logoUrl: joinPublicUrl(appPublicUrl, FRONTEND_LOGO_PATH),
    };
  }

  const apiPublicUrl = getApiPublicUrl();
  if (apiPublicUrl && isHttpsUrl(apiPublicUrl)) {
    return {
      heroUrl: joinPublicUrl(apiPublicUrl, API_HERO_PATH),
      logoUrl: joinPublicUrl(apiPublicUrl, API_LOGO_PATH),
    };
  }

  return {};
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
}

function localizedString(value: string) {
  return {
    defaultValue: {
      language: "pt-BR",
      value,
    },
  };
}

function buildWalletImage(uri: string) {
  return {
    sourceUri: { uri },
    contentDescription: localizedString("VIBRA"),
  };
}

function buildGoogleWalletVenue(location: string): {
  name: string;
  address: string;
} {
  const trimmed = location.trim() || "Local a confirmar";
  const parts = trimmed
    .split(/\s*[—–-]\s*|\n/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 2) {
    const venueName = parts[0] ?? trimmed;
    return {
      name: truncate(venueName, 120),
      address: truncate(parts.slice(1).join("\n"), 200),
    };
  }

  return {
    name: truncate(trimmed, 120),
    address: truncate(trimmed, 200),
  };
}

function isInvalidImageError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" &&
          error !== null &&
          "message" in error &&
          typeof (error as { message: unknown }).message === "string"
        ? (error as { message: string }).message
        : String(error);

  return /invalid image url|could not load image/i.test(message);
}

function buildClassBody(
  event: Event,
  classId: string,
  brandImages: BrandImageUrls,
) {
  const venue = buildGoogleWalletVenue(event.location);
  const heroImage = brandImages.heroUrl
    ? buildWalletImage(brandImages.heroUrl)
    : undefined;
  const logo = brandImages.logoUrl
    ? buildWalletImage(brandImages.logoUrl)
    : undefined;

  return {
    id: classId,
    issuerName: getIssuerDisplayName(),
    reviewStatus: "underReview" as const,
    eventName: localizedString(truncate(event.title, 120)),
    venue: {
      name: localizedString(venue.name),
      address: localizedString(venue.address),
    },
    dateTime: {
      start: event.date.toISOString(),
    },
    hexBackgroundColor: GOOGLE_WALLET_BACKGROUND_COLOR,
    ...(logo ? { logo } : {}),
    ...(heroImage ? { heroImage } : {}),
  };
}

async function upsertClass(
  wallet: ReturnType<typeof google.walletobjects>,
  classId: string,
  classBody: ReturnType<typeof buildClassBody>,
): Promise<void> {
  try {
    const existing = await wallet.eventticketclass.get({ resourceId: classId });
    const nextBody = { ...existing.data, ...classBody };

    if (!("heroImage" in classBody)) {
      delete (nextBody as { heroImage?: unknown }).heroImage;
      delete (nextBody as { logo?: unknown }).logo;
    }
    delete (nextBody as { logoImage?: unknown }).logoImage;

    await wallet.eventticketclass.update({
      resourceId: classId,
      requestBody: nextBody,
    });
  } catch (error) {
    const status = (error as { code?: number }).code;
    if (status === 404) {
      await wallet.eventticketclass.insert({ requestBody: classBody });
      return;
    }
    throw error;
  }
}

export async function ensureGoogleEventTicketClass(
  event: Event,
  classId: string,
): Promise<void> {
  const credentials = await loadGoogleCredentials();
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/wallet_object.issuer"],
  });

  const wallet = google.walletobjects({ version: "v1", auth });
  const brandImages = resolveBrandImageUrls();

  try {
    await upsertClass(
      wallet,
      classId,
      buildClassBody(event, classId, brandImages),
    );
  } catch (error) {
    if (
      (!brandImages.heroUrl && !brandImages.logoUrl) ||
      !isInvalidImageError(error)
    ) {
      throw error;
    }

    // Imagem ainda não publicada / URL inválida: card preto sem logo (não derruba o fluxo).
    logger.warn(CONTEXT, "Brand image rejected by Google Wallet; retrying without images", {
      classId,
      brandImages,
      error: error instanceof Error ? error.message : String(error),
    });

    await upsertClass(wallet, classId, buildClassBody(event, classId, {}));
  }
}

export function buildGoogleWalletOrigins(
  requestOrigin?: string | null,
): string[] {
  const origins = new Set(
    env.wallet.google.origins
      .map((origin) => origin.trim().replace(/\/+$/, ""))
      .filter(Boolean),
  );

  if (requestOrigin?.trim()) {
    try {
      const url = new URL(requestOrigin);
      origins.add(`${url.protocol}//${url.host}`);
    } catch {
      // ignore malformed origin header
    }
  }

  const result = Array.from(origins);

  if (result.length === 0) {
    throw new WalletConfigError("GOOGLE_WALLET_ORIGINS is not configured");
  }

  return result;
}
