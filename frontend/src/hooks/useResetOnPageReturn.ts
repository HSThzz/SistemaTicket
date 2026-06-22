/**
 * @file Reseta estado preso quando o usuário volta à página após redirecionamento externo.
 * @module hooks/useResetOnPageReturn
 */

import { useEffect } from "react";

/**
 * Invoca o callback quando a página volta ao foco após navegação externa
 * (botão voltar do navegador ou restauração do bfcache).
 */
export function useResetOnPageReturn(onReturn: () => void): void {
  useEffect(() => {
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        onReturn();
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        onReturn();
      }
    };

    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [onReturn]);
}
