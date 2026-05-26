import type { AxiosError } from "axios";
import type { ApiErrorBody } from "../types/api";

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
