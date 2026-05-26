import { Navigate, Outlet } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { useAuth } from "../context/AuthContext";

const PRODUCER_ROLES = new Set(["PRODUCER", "ADMIN"]);

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

  return <Outlet />;
}
