/**
 * @file Hook: se o usuário autenticado tem acesso à área de check-in.
 * @module modules/ticketing/features/check-in/hooks/useCheckInAccess
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import { isProducerPanelRole } from "@/modules/identity/features/admin/utils/adminRoles";
import * as checkInService from "@/modules/ticketing/api/checkInService";

/**
 * Produtores/admins têm acesso imediato; clientes consultam a API de vínculo.
 */
export function useCheckInAccess(): { canCheckIn: boolean; loading: boolean } {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const [canCheckIn, setCanCheckIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (isBootstrapping) {
        return;
      }

      if (!isAuthenticated || !user) {
        if (!cancelled) {
          setCanCheckIn(false);
          setLoading(false);
        }
        return;
      }

      if (isProducerPanelRole(user.role)) {
        if (!cancelled) {
          setCanCheckIn(true);
          setLoading(false);
        }
        return;
      }

      try {
        const allowed = await checkInService.getCheckInAccess();
        if (!cancelled) {
          setCanCheckIn(allowed);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setCanCheckIn(false);
          setLoading(false);
        }
      }
    }

    setLoading(true);
    void load();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isBootstrapping, user]);

  return { canCheckIn, loading };
}
