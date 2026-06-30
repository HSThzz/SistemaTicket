/**
 * @file Componente raiz com definição de rotas e guards de autenticação.
 * @module App
 */

import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { GuestRoute } from "@/components/auth/GuestRoute";
import { Layout } from "@/components/layout/Layout";
import { ProducerRoute } from "@/components/auth/ProducerRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/modules/identity/features/auth/context/AuthContext";
import { FavoritesProvider } from "@/modules/identity/features/profile/context/FavoritesContext";
import { ParticipationProvider } from "@/modules/participation/features/requests/context/ParticipationContext";
import { CheckoutPage } from "@/modules/sales/features/checkout/pages/CheckoutPage";
import { EventDetailPage } from "@/modules/catalog/features/browse/pages/EventDetailPage";
import { EventsPage } from "@/modules/catalog/features/browse/pages/EventsPage";
import { HomePage } from "@/app/pages/HomePage";
import { LoginPage } from "@/modules/identity/features/auth/pages/LoginPage";
import { MyOrdersPage } from "@/modules/sales/features/orders/pages/MyOrdersPage";
import { MyTicketsPage } from "@/modules/ticketing/features/wallet/pages/MyTicketsPage";
import { ProfilePage } from "@/modules/identity/features/profile/pages/ProfilePage";
import { RegisterPage } from "@/modules/identity/features/auth/pages/RegisterPage";
import { ProducerCheckInPage } from "@/modules/ticketing/features/check-in/pages/ProducerCheckInPage";
import { ProducerCreateEventPage } from "@/modules/catalog/features/producer/pages/ProducerCreateEventPage";
import { ProducerDashboardPage } from "@/modules/catalog/features/producer/pages/ProducerDashboardPage";
import { ProducerEventsPage } from "@/modules/catalog/features/producer/pages/ProducerEventsPage";
import { ProducerManageEventPage } from "@/modules/catalog/features/producer/pages/ProducerManageEventPage";
import { AdminDashboardPage } from "@/modules/identity/features/admin/pages/AdminDashboardPage";
import { ProducerLandingPage } from "@/modules/leads/features/contact/pages/ProducerLandingPage";

/**
 * Aplicação SPA: layout compartilhado, rotas públicas, protegidas e área do produtor.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FavoritesProvider>
        <ParticipationProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="eventos" element={<EventsPage />} />
            <Route path="para-produtores" element={<ProducerLandingPage />} />
            <Route path="eventos/:eventId" element={<EventDetailPage />} />

            <Route element={<GuestRoute />}>
              <Route path="login" element={<LoginPage />} />
              <Route path="cadastro" element={<RegisterPage />} />
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route path="perfil" element={<ProfilePage />} />
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

            <Route element={<AdminRoute />}>
              <Route path="admin" element={<AdminDashboardPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
        </ParticipationProvider>
        </FavoritesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
