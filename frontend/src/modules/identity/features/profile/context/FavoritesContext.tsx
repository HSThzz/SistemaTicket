/**
 * @file Contexto React de favoritos sincronizado com a API.
 * @module context/FavoritesContext
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as favoritesService from "@/modules/identity/api/favoritesService";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";

const STORAGE_PREFIX = "vibra:favorites";

function readLocalFavorites(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:${userId}`);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}

function clearLocalFavorites(userId: string) {
  localStorage.removeItem(`${STORAGE_PREFIX}:${userId}`);
}

async function migrateLocalFavorites(userId: string, serverIds: string[]) {
  const localIds = readLocalFavorites(userId);

  if (localIds.length === 0) {
    return serverIds;
  }

  const serverSet = new Set(serverIds);
  const toSync = localIds.filter((id) => !serverSet.has(id));

  await Promise.all(
    toSync.map((eventId) =>
      favoritesService.addFavorite(eventId).catch(() => undefined),
    ),
  );

  clearLocalFavorites(userId);

  if (toSync.length === 0) {
    return serverIds;
  }

  return favoritesService.listFavoriteIds();
}

interface FavoritesContextValue {
  favoriteIds: string[];
  isFavorite: (eventId: string) => boolean;
  toggleFavorite: (eventId: string) => Promise<boolean>;
  isLoading: boolean;
  isReady: boolean;
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const userId = user?.id;
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReady, setIsReady] = useState(!isAuthenticated);

  useEffect(() => {
    if (!userId) {
      setFavoriteIds([]);
      setIsReady(true);
      return;
    }

    let cancelled = false;

    setIsLoading(true);
    setIsReady(false);

    favoritesService
      .listFavoriteIds()
      .then((serverIds) => migrateLocalFavorites(userId, serverIds))
      .then((ids) => {
        if (!cancelled) {
          setFavoriteIds(ids);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFavoriteIds(readLocalFavorites(userId));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
          setIsReady(true);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const isFavorite = useCallback(
    (eventId: string) => favoriteIds.includes(eventId),
    [favoriteIds],
  );

  const toggleFavorite = useCallback(
    async (eventId: string): Promise<boolean> => {
      if (!userId) {
        return false;
      }

      const wasFavorite = favoriteIds.includes(eventId);
      const optimisticIds = wasFavorite
        ? favoriteIds.filter((id) => id !== eventId)
        : [...favoriteIds, eventId];

      setFavoriteIds(optimisticIds);

      try {
        if (wasFavorite) {
          await favoritesService.removeFavorite(eventId);
        } else {
          await favoritesService.addFavorite(eventId);
        }
        return true;
      } catch {
        setFavoriteIds(favoriteIds);
        return false;
      }
    },
    [favoriteIds, userId],
  );

  const value = useMemo(
    () => ({
      favoriteIds,
      isFavorite,
      toggleFavorite,
      isLoading,
      isReady,
    }),
    [favoriteIds, isFavorite, toggleFavorite, isLoading, isReady],
  );

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
}

export function useFavorites(): FavoritesContextValue {
  const context = useContext(FavoritesContext);

  if (!context) {
    throw new Error("useFavorites must be used within FavoritesProvider");
  }

  return context;
}
