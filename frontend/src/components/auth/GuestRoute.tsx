/**
 * @file Guard de rota apenas para visitantes não autenticados (login/cadastro).
 * @module components/GuestRoute
 */

import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "@/modules/identity/context/AuthContext";

/**
 * Redireciona usuários já logados para a home; exibe loader durante bootstrap.
 */
export function GuestRoute() {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <Center py="xl">
        <Loader color="brand" />
      </Center>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
