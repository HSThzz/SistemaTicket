/**
 * @file Garante que a EventTicketClass existe na API do Google Wallet.
 * @module ticketing/application/services/ensureGoogleEventTicketClass
 */

import { google } from "googleapis";
import { env } from "../../../../shared/infrastructure/config/env";
import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { WalletConfigError } from "../../domain/errors/WalletError";
import { loadGoogleCredentials } from "../helpers/walletHelpers";

function getIssuerDisplayName(): string {
  return env.wallet.google.issuerName.trim() || "VIBRA";
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength - 1)}…`;
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

  const classBody = {
    id: classId,
    issuerName: getIssuerDisplayName(),
    reviewStatus: "underReview" as const,
    eventName: {
      defaultValue: {
        language: "pt-BR",
        value: truncate(event.title, 120),
      },
    },
    venue: {
      name: {
        defaultValue: {
          language: "pt-BR",
          value: truncate(event.location, 120),
        },
      },
    },
    dateTime: {
      start: event.date.toISOString(),
    },
    hexBackgroundColor: "#16A34A",
  };

  try {
    await wallet.eventticketclass.get({ resourceId: classId });
    await wallet.eventticketclass.patch({
      resourceId: classId,
      requestBody: classBody,
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

export function buildGoogleWalletOrigins(requestOrigin?: string | null): string[] {
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
