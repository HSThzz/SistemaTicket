import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute } from "./components/GuestRoute";
import { Layout } from "./components/Layout";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { EventDetailPage } from "./pages/EventDetailPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { RegisterPage } from "./pages/RegisterPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="eventos/:eventId" element={<EventDetailPage />} />

            <Route element={<GuestRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="cadastro" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route
                path="ingressos"
                element={
                  <PlaceholderPage
                    title="Meus ingressos"
                    description="Lista de ingressos emitidos após pagamento confirmado."
                  />
                }
              />
              <Route
                path="pedidos"
                element={
                  <PlaceholderPage
                    title="Meus pedidos"
                    description="Histórico de pedidos e status de pagamento."
                  />
                }
              />
              <Route
                path="eventos/:eventId/comprar"
                element={
                  <PlaceholderPage
                    title="Checkout"
                    description="Fluxo de reserva e pagamento PIX em breve."
                  />
                }
              />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
