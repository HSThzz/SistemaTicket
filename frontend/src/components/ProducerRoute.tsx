/**
 * @file Guard de rota restrita a produtores e administradores.
 * @module components/ProducerRoute
 */

import { Navigate, Outlet } from "react-router-dom";
import { Box, Center, Loader } from "@mantine/core";
import { ProducerCheckInFab } from "./producer/ProducerCheckInFab";
import { useAuth } from "../context/AuthContext";

const PRODUCER_ROLES = new Set(["PRODUCER", "ADMIN"]);

/**
 * Exige autenticação e papel `PRODUCER` ou `ADMIN`; demais perfis voltam à home.
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

  if (!PRODUCER_ROLES.has(user.role)) {
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
