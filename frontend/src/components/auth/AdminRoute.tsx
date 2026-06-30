/**
 * @file Guard de rota restrita à equipe administrativa (suporte e plataforma).
 * @module components/AdminRoute
 */

import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "@/modules/identity/features/auth/context/AuthContext";
import { isStaffRole } from "@/modules/identity/features/admin/utils/adminRoles";

/**
 * Exige autenticação e papel `ADMIN` ou `SUPER_ADMIN`; demais perfis voltam à home.
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

  if (!isStaffRole(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
