/**
 * @file Atalhos principais do produtor visíveis no mobile (abaixo do cabeçalho da página).
 */

import { Button, SimpleGrid } from "@mantine/core";
import { Link } from "react-router-dom";
import {
  IconCalendarEvent,
  IconChartBar,
  IconPlus,
  IconScan,
} from "@tabler/icons-react";

type ProducerMobileActionsVariant = "dashboard" | "events";

interface ProducerMobileActionsProps {
  variant: ProducerMobileActionsVariant;
}

/**
 * Botões de ação rápida para telas estreitas — posicionados antes do conteúdo principal.
 */
export function ProducerMobileActions({ variant }: ProducerMobileActionsProps) {
  return (
    <SimpleGrid cols={2} spacing="sm" hiddenFrom="sm" className="producer-mobile-actions">
      {variant === "dashboard" ? (
        <Button
          component={Link}
          to="/produtor/eventos"
          variant="light"
          radius="xl"
          leftSection={<IconCalendarEvent size={18} />}
          fullWidth
        >
          Meus eventos
        </Button>
      ) : (
        <Button
          component={Link}
          to="/produtor"
          variant="light"
          radius="xl"
          leftSection={<IconChartBar size={18} />}
          fullWidth
        >
          Dashboard
        </Button>
      )}
      <Button
        component={Link}
        to="/produtor/check-in"
        variant="light"
        radius="xl"
        color="teal"
        leftSection={<IconScan size={18} />}
        fullWidth
      >
        Check-in
      </Button>
      <Button
        component={Link}
        to="/produtor/eventos/novo"
        radius="xl"
        leftSection={<IconPlus size={18} />}
        fullWidth
        style={{ gridColumn: "1 / -1" }}
      >
        Novo evento
      </Button>
    </SimpleGrid>
  );
}
