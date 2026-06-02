/**
 * @file Guard de rota restrita a administradores.
 * @module components/AdminRoute
 */

import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "../context/AuthContext";

/**
 * Exige autenticação e papel `ADMIN`; demais perfis voltam à home.
 */
export function AdminRoute() {
  const { user, isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return (
      <Center py="xl">
        <Loader color="brand" />
      </Center>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace state={{ from: "/admin" }} />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
