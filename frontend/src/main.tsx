/**
 * @file Ponto de entrada Vite: Monta React com Mantine e tema da aplicação.
 * @module main
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import "@mantine/core/styles.css";
import "@mantine/carousel/styles.css";
import "@mantine/notifications/styles.css";
import App from "./App.tsx";
import { appTheme } from "./theme";
import { colorSchemeManager } from "./theme/colorScheme";
import "./index.css";
import "./styles/home.css";
import "./styles/landing.css";
import "./styles/events.css";
import "./styles/account.css";
import "./styles/producer-landing.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider
      theme={appTheme}
      colorSchemeManager={colorSchemeManager}
      defaultColorScheme="light"
    >
      <Notifications position="top-right" zIndex={1000} />
      <App />
    </MantineProvider>
  </StrictMode>,
);
