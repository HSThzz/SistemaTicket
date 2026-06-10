/**
 * @file Preload de capa de evento para melhorar LCP em páginas com hero visual.
 * @module hooks/useEventCoverPreload
 */

import { useEffect } from "react";
import { preloadEventCoverImage } from "../utils/eventVisuals";

/**
 * Preload da imagem de capa assim que a URL estiver disponível.
 *
 * @param imageUrl - URL da capa ou `null` quando só há gradiente.
 */
export function useEventCoverPreload(imageUrl: string | null | undefined): void {
  useEffect(() => {
    preloadEventCoverImage(imageUrl);
  }, [imageUrl]);
}
