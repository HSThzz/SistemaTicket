/**
 * @file Utilitários para extrair mensagens de erro da API e exceções.
 * @module utils/errors
 */

import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/shared/types/api";

/**
 * Converte um erro desconhecido em mensagem legível para o usuário.
 *
 * @param error - Erro capturado (Axios, `Error` ou outro).
 * @param fallback - Mensagem padrão quando não há detalhe utilizável.
 * @returns Texto pronto para exibição em alertas ou notificações.
 */
export function getApiErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    return axiosError.response?.data?.error ?? axiosError.message ?? fallback;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}

/**
 * Extrai o código de erro estável retornado pela API (campo `code`), se houver.
 *
 * @param error - Erro capturado (Axios ou outro).
 * @returns Código como string ou `null`.
 */
export function getApiErrorCode(error: unknown): string | null {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    return axiosError.response?.data?.code ?? null;
  }

  return null;
}
