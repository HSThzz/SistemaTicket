import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { AuthProvider } from "./context/AuthContext";
import { HomePage } from "./pages/HomePage";
import { PlaceholderPage } from "./pages/PlaceholderPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
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
              path="login"
              element={
                <PlaceholderPage title="Entrar" description="Tela de login em breve." />
              }
            />
            <Route
              path="cadastro"
              element={
                <PlaceholderPage title="Cadastro" description="Tela de cadastro em breve." />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
