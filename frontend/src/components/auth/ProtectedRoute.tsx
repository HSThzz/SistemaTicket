/**
 * @file Guard de rota que exige usuário autenticado.
 * @module components/ProtectedRoute
 */

import { Navigate, Outlet, useLocation } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";

/**
 * Redireciona para login se não autenticado; preserva `from` no state para retorno.
 */
export function ProtectedRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();
  const location = useLocation();

  if (isBootstrapping) {
    return (
      <Center py="xl">
        <Loader color="brand" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
