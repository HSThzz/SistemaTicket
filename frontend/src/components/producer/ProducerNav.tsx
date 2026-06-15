/**
 * @file Navegação por abas do painel do produtor.
 */

import { Button, Group } from "@mantine/core";
import { Link, useLocation } from "react-router-dom";
import {
  IconCalendarEvent,
  IconLayoutDashboard,
  IconPlus,
  IconScan,
} from "@tabler/icons-react";

const PRODUCER_TABS = [
  {
    value: "dashboard",
    to: "/produtor",
    label: "Dashboard",
    description: "Métricas e desempenho",
    icon: IconLayoutDashboard,
  },
  {
    value: "events",
    to: "/produtor/eventos",
    label: "Meus eventos",
    description: "Criar e gerenciar",
    icon: IconCalendarEvent,
  },
  {
    value: "checkin",
    to: "/produtor/check-in",
    label: "Check-in",
    description: "Validar ingressos",
    icon: IconScan,
  },
] as const;

function resolveActiveTab(pathname: string): (typeof PRODUCER_TABS)[number]["value"] {
  if (pathname.startsWith("/produtor/check-in")) {
    return "checkin";
  }

  if (pathname.startsWith("/produtor/eventos")) {
    return "events";
  }

  return "dashboard";
}

interface ProducerNavProps {
  showCreateEvent?: boolean;
}

/**
 * Abas principais do produtor — separa visão analítica, gestão de eventos e check-in.
 */
export function ProducerNav({ showCreateEvent = true }: ProducerNavProps) {
  const { pathname } = useLocation();
  const activeTab = resolveActiveTab(pathname);

  return (
    <Group justify="space-between" align="flex-end" wrap="wrap" gap="md" className="producer-nav">
      <Group gap="xs" wrap="wrap" className="producer-nav-tabs">
        {PRODUCER_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <Button
              key={tab.value}
              component={Link}
              to={tab.to}
              variant={isActive ? "filled" : "light"}
              radius="xl"
              leftSection={<Icon size={16} />}
              className="producer-nav-tab"
            >
              <span className="producer-nav-tab-label">{tab.label}</span>
              <span className="producer-nav-tab-description">{tab.description}</span>
            </Button>
          );
        })}
      </Group>

      {showCreateEvent ? (
        <Button
          component={Link}
          to="/produtor/eventos/novo"
          radius="xl"
          leftSection={<IconPlus size={18} />}
          className="producer-nav-create"
        >
          Novo evento
        </Button>
      ) : null}
    </Group>
  );
}
