/**
 * @file Guard de rota da área de check-in (produtor, admin ou equipe de portaria).
 * @module components/CheckInRoute
 */

import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import { isProducerPanelRole } from "@/modules/identity/features/admin/utils/adminRoles";
import * as checkInService from "@/modules/ticketing/api/checkInService";

/**
 * Exige autenticação e permissão de check-in (papel de produtor/admin ou vínculo de portaria).
 */
export function CheckInRoute() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function resolveAccess() {
      if (isBootstrapping) {
        return;
      }

      if (!isAuthenticated || !user) {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
        return;
      }

      if (isProducerPanelRole(user.role)) {
        if (!cancelled) {
          setAllowed(true);
          setChecking(false);
        }
        return;
      }

      try {
        const canCheckIn = await checkInService.getCheckInAccess();
        if (!cancelled) {
          setAllowed(canCheckIn);
          setChecking(false);
        }
      } catch {
        if (!cancelled) {
          setAllowed(false);
          setChecking(false);
        }
      }
    }

    setChecking(true);
    void resolveAccess();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isBootstrapping, user]);

  if (isBootstrapping || checking) {
    return (
      <Center py="xl">
        <Loader color="brand" />
      </Center>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: "/produtor/check-in" }} />;
  }

  if (!allowed) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
