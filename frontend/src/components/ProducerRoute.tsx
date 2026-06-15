/**
 * @file Guard de rota restrita a produtores e administradores.
 * @module components/ProducerRoute
 */

import { Navigate, Outlet } from "react-router-dom";
import { Box, Center, Loader } from "@mantine/core";
import { ProducerCheckInFab } from "./producer/ProducerCheckInFab";
import { useAuth } from "../context/AuthContext";
import { isProducerPanelRole } from "../utils/adminRoles";

/**
 * Exige autenticação e papel de produtor ou equipe admin; demais perfis voltam à home.
 */
export function ProducerRoute() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <Center py="xl">
        <Loader color="brand" />
      </Center>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: "/produtor" }} />;
  }

  if (!isProducerPanelRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Box className="producer-shell">
        <Outlet />
      </Box>
      <ProducerCheckInFab />
    </>
  );
}
