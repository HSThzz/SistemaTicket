/**
 * @file Integração com Apple Wallet e Google Wallet para ingressos digitais.
 * @module modules/ticketing/api/walletService
 */

import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/shared/types/api";
import { getApiErrorMessage } from "@/shared/utils/errors";
import { api } from "@/shared/api/client";

const APPLE_PASS_MIME = "application/vnd.apple.pkpass";

/**
 * Tenta extrair mensagem de erro de resposta blob JSON da API de wallet.
 *
 * @param data - Corpo da resposta em formato Blob.
 */
async function parseBlobError(data: Blob): Promise<string | null> {
  try {
    const text = await data.text();
    const parsed = JSON.parse(text) as ApiErrorBody;
    return parsed.error ?? null;
  } catch {
    return null;
  }
}

/**
 * Mensagem de erro amigável para falhas de download/abertura de wallet.
 *
 * @param error - Erro capturado (pode incluir resposta blob).
 * @param fallback - Texto padrão.
 */
export async function getWalletErrorMessage(
  error: unknown,
  fallback = "Não foi possível adicionar à carteira.",
): Promise<string> {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiErrorBody | Blob>;
    const data = axiosError.response?.data;

    if (data instanceof Blob) {
      const message = await parseBlobError(data);
      if (message) {
        return message;
      }
    }
  }

  return getApiErrorMessage(error, fallback);
}

/**
 * Baixa ou abre o arquivo `.pkpass` da Apple Wallet para um ingresso.
 * Em iOS redireciona para o pass; em desktop dispara download.
 *
 * @param ticketId - Identificador do ingresso.
 */
export async function downloadAppleWalletPass(ticketId: string): Promise<void> {
  const response = await api.get<Blob>(`/wallet/apple/${ticketId}`, {
    responseType: "blob",
  });

  const blob = response.data;

  if (blob.type.includes("json") || blob.type.includes("text")) {
    const message = await parseBlobError(blob);
    throw new Error(message ?? "Não foi possível gerar o pass da Apple Wallet.");
  }

  const passBlob = blob.type.includes("pkpass")
    ? blob
    : new Blob([blob], { type: APPLE_PASS_MIME });

  const url = URL.createObjectURL(passBlob);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

  try {
    if (isIOS) {
      window.location.assign(url);
      return;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = `ingresso-${ticketId.slice(0, 8)}.pkpass`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } finally {
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
  }
}

/**
 * Obtém link do Google Wallet e redireciona o navegador.
 *
 * @param ticketId - Identificador do ingresso.
 */
export async function openGoogleWallet(ticketId: string): Promise<void> {
  const { data } = await api.get<{ url: string }>(`/wallet/google/${ticketId}/link`);

  if (!data.url) {
    throw new Error("Link do Google Wallet indisponível.");
  }

  window.location.href = data.url;
}
