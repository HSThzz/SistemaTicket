/**
 * @file Cliente HTTP Axios compartilhado com autenticação Bearer.
 * @module shared/api/client
 */

import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** Chave do `localStorage` onde o token JWT de autenticação é persistido. */
export const AUTH_TOKEN_KEY = "auth_token";

/**
 * Instância Axios pré-configurada com URL base da API e cabeçalho JSON.
 * O interceptor de requisição anexa o token Bearer quando presente.
 */
export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

/**
 * Persiste ou remove o token de autenticação no `localStorage`.
 *
 * @param token - Token JWT ou `null` para encerrar a sessão local.
 */
export function setAuthToken(token: string | null): void {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
}

/**
 * Lê o token de autenticação armazenado localmente.
 *
 * @returns Token JWT ou `null` se não houver sessão salva.
 */
export function getAuthToken(): string | null {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}
