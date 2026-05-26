import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { GuestRoute } from "./components/GuestRoute";
import { Layout } from "./components/Layout";
import { ProducerRoute } from "./components/ProducerRoute";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import { CheckoutPage } from "./pages/CheckoutPage";
import { EventDetailPage } from "./pages/EventDetailPage";
import { HomePage } from "./pages/HomePage";
import { LoginPage } from "./pages/LoginPage";
import { MyOrdersPage } from "./pages/MyOrdersPage";
import { MyTicketsPage } from "./pages/MyTicketsPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProducerCheckInPage } from "./pages/producer/ProducerCheckInPage";
import { ProducerCreateEventPage } from "./pages/producer/ProducerCreateEventPage";
import { ProducerDashboardPage } from "./pages/producer/ProducerDashboardPage";
import { ProducerEventsPage } from "./pages/producer/ProducerEventsPage";
import { ProducerManageEventPage } from "./pages/producer/ProducerManageEventPage";

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
              <Route path="ingressos" element={<MyTicketsPage />} />
              <Route path="pedidos" element={<MyOrdersPage />} />
              <Route path="eventos/:eventId/comprar" element={<CheckoutPage />} />
            </Route>

            <Route element={<ProducerRoute />}>
              <Route path="produtor" element={<ProducerDashboardPage />} />
              <Route path="produtor/eventos" element={<ProducerEventsPage />} />
              <Route path="produtor/eventos/novo" element={<ProducerCreateEventPage />} />
              <Route path="produtor/eventos/:eventId" element={<ProducerManageEventPage />} />
              <Route path="produtor/check-in" element={<ProducerCheckInPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
