/**
 * @file Botão flutuante de check-in nas páginas do produtor (mobile/tablet).
 */

import { Affix, Button } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import { IconScan } from "@tabler/icons-react";

/**
 * Atalho fixo para a portaria — oculto na própria página de check-in.
 */
export function ProducerCheckInFab() {
  const location = useLocation();
  const isProducerArea = location.pathname.startsWith("/produtor");
  const isCheckInPage = location.pathname === "/produtor/check-in";

  if (!isProducerArea || isCheckInPage) {
    return null;
  }

  return (
    <Affix position={{ bottom: 20, right: 16 }} zIndex={250} hiddenFrom="md">
      <Button
        component={Link}
        to="/produtor/check-in"
        radius="xl"
        size="md"
        color="teal"
        leftSection={<IconScan size={20} />}
        className="producer-checkin-fab"
        aria-label="Abrir check-in na portaria"
      >
        Check-in
      </Button>
    </Affix>
  );
}
