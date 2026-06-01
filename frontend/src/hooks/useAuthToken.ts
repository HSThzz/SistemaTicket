/**
 * @file Hook que sincroniza o token JWT com alterações no `localStorage` (outras abas).
 * @module hooks/useAuthToken
 */

import { useSyncExternalStore } from "react";
import { AUTH_TOKEN_KEY, getAuthToken } from "../shared/api/client";

/**
 * Inscreve callback para eventos `storage` que afetam a chave do token.
 *
 * @param callback - Função chamada quando o token muda em outra aba.
 */
function subscribe(callback: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === AUTH_TOKEN_KEY || event.key === null) {
      callback();
    }
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

/**
 * Lê o token de autenticação reativo a mudanças cross-tab no `localStorage`.
 *
 * @returns Token JWT atual ou `null`.
 */
export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getAuthToken, () => null);
}
