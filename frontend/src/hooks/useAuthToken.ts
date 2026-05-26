import { useSyncExternalStore } from "react";
import { AUTH_TOKEN_KEY, getAuthToken } from "../services/api";

function subscribe(callback: () => void): () => void {
  const handler = (event: StorageEvent) => {
    if (event.key === AUTH_TOKEN_KEY || event.key === null) {
      callback();
    }
  };

  window.addEventListener("storage", handler);
  return () => window.removeEventListener("storage", handler);
}

export function useAuthToken(): string | null {
  return useSyncExternalStore(subscribe, getAuthToken, () => null);
}
