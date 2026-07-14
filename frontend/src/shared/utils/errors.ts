/**
 * @file Utilitários para extrair mensagens de erro da API e exceções.
 * @module utils/errors
 */

import type { AxiosError } from "axios";
import type { ApiErrorBody } from "@/shared/types/api";
import { resolveApiErrorMessage } from "@/shared/utils/apiErrorMessages";

/**
 * Converte um erro desconhecido em mensagem legível para o usuário.
 *
 * Prioridade:
 * 1. Tradução do `code` da API (exceto validação — usa detalhe do campo)
 * 2. Mensagem `error` do corpo da resposta (ex.: Zod em português)
 * 3. Fallback informado pelo chamador
 *
 * @param error - Erro capturado (Axios, `Error` ou outro).
 * @param fallback - Mensagem padrão quando não há detalhe utilizável.
 * @returns Texto pronto para exibição em alertas ou notificações.
 */
export function getApiErrorMessage(error: unknown, fallback = "Ocorreu um erro inesperado."): string {
  if (typeof error === "object" && error !== null && "isAxiosError" in error) {
    const axiosError = error as AxiosError<ApiErrorBody>;
    const code = axiosError.response?.data?.code ?? null;
    const apiMessage = axiosError.response?.data?.error;

    // Validação: preferir a mensagem do Zod/campo (já em PT via locale).
    if (code === "VALIDATION_ERROR" && apiMessage) {
      return apiMessage;
    }

    const translated = resolveApiErrorMessage(code);
    if (translated) {
      return translated;
    }

    if (apiMessage) {
      return apiMessage;
    }

    if (axiosError.message === "Network Error") {
      return "Não foi possível conectar ao servidor. Verifique sua internet.";
    }

    return axiosError.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
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
