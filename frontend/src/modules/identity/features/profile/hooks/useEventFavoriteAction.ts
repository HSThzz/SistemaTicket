/**
 * @file Ação de favoritar evento com feedback via toast.
 * @module hooks/useEventFavoriteAction
 */

import type { MouseEvent } from "react";
import { useNavigate } from "react-router-dom";
import { notifications } from "@mantine/notifications";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import { useFavorites } from "./useFavorites";

interface UseEventFavoriteActionOptions {
  eventId: string;
  loginReturnPath?: string;
}

export function useEventFavoriteAction({
  eventId,
  loginReturnPath,
}: UseEventFavoriteActionOptions) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const liked = isFavorite(eventId);

  const handleToggleFavorite = async (clickEvent?: MouseEvent) => {
    clickEvent?.preventDefault();
    clickEvent?.stopPropagation();

    if (!isAuthenticated) {
      navigate("/login", {
        state: { from: loginReturnPath ?? `/eventos/${eventId || ""}` },
      });
      return;
    }

    const wasFavorite = liked;
    const success = await toggleFavorite(eventId);

    if (success) {
      notifications.show({
        title: wasFavorite ? "Removido dos favoritos" : "Salvo nos favoritos",
        message: wasFavorite
          ? "O evento saiu da sua lista de salvos."
          : "Você pode ver seus favoritos no perfil.",
        color: wasFavorite ? "gray" : "green",
      });
      return;
    }

    notifications.show({
      title: "Não foi possível atualizar",
      message: "Tente novamente em alguns instantes.",
      color: "red",
    });
  };

  return { liked, handleToggleFavorite };
}
