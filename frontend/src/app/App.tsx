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
import { AuthProvider } from "@/modules/identity/context/AuthContext";
import { FavoritesProvider } from "@/modules/identity/context/FavoritesContext";
import { ParticipationProvider } from "@/modules/participation/context/ParticipationContext";
import { CheckoutPage } from "@/modules/sales/pages/CheckoutPage";
import { EventDetailPage } from "@/modules/catalog/pages/EventDetailPage";
import { EventsPage } from "@/modules/catalog/pages/EventsPage";
import { HomePage } from "@/app/pages/HomePage";
import { LoginPage } from "@/modules/identity/pages/LoginPage";
import { MyOrdersPage } from "@/modules/sales/pages/MyOrdersPage";
import { MyTicketsPage } from "@/modules/ticketing/pages/MyTicketsPage";
import { ProfilePage } from "@/modules/identity/pages/ProfilePage";
import { RegisterPage } from "@/modules/identity/pages/RegisterPage";
import { ProducerCheckInPage } from "@/modules/ticketing/pages/producer/ProducerCheckInPage";
import { ProducerCreateEventPage } from "@/modules/catalog/pages/producer/ProducerCreateEventPage";
import { ProducerDashboardPage } from "@/modules/catalog/pages/producer/ProducerDashboardPage";
import { ProducerEventsPage } from "@/modules/catalog/pages/producer/ProducerEventsPage";
import { ProducerManageEventPage } from "@/modules/catalog/pages/producer/ProducerManageEventPage";
import { AdminDashboardPage } from "@/modules/identity/pages/admin/AdminDashboardPage";
import { ProducerLandingPage } from "@/modules/leads/pages/ProducerLandingPage";

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
