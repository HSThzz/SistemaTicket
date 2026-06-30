/**
 * @file Navegação por abas do painel administrativo.
 */

import { Group, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import {
  IconDatabase,
  IconHeadset,
  IconTicket,
} from "@tabler/icons-react";
import type { TablerIcon } from "@tabler/icons-react";

export type AdminTab = "support" | "issue" | "platform";

const ADMIN_TABS: Array<{
  value: AdminTab;
  label: string;
  description: string;
  icon: TablerIcon;
  superAdminOnly?: boolean;
}> = [
  {
    value: "support",
    label: "Suporte",
    description: "Usuários e reembolsos",
    icon: IconHeadset,
  },
  {
    value: "issue",
    label: "Emitir ingressos",
    description: "Cortesia e liberação offline",
    icon: IconTicket,
    superAdminOnly: true,
  },
  {
    value: "platform",
    label: "Plataforma",
    description: "Papéis, estoque e histórico",
    icon: IconDatabase,
    superAdminOnly: true,
  },
];

interface AdminNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  showPlatform?: boolean;
}

/**
 * Abas do painel admin — mesmo padrão visual do produtor.
 */
export function AdminNav({
  activeTab,
  onTabChange,
  showPlatform = false,
}: AdminNavProps) {
  const tabs = showPlatform
    ? ADMIN_TABS
    : ADMIN_TABS.filter((tab) => !tab.superAdminOnly);

  return (
    <Stack gap="sm" className="admin-nav">
      <Group
        gap="xs"
        wrap="wrap"
        className={`admin-nav-tabs${tabs.length === 1 ? " admin-nav-tabs--single" : ""}`}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.value;

          return (
            <UnstyledButton
              key={tab.value}
              type="button"
              onClick={() => onTabChange(tab.value)}
              className={`admin-nav-tab${isActive ? " is-active" : ""}`}
            >
              <ThemeIcon
                size={34}
                radius="md"
                variant="light"
                color={isActive ? "brand" : "gray"}
              >
                <Icon size={18} />
              </ThemeIcon>
              <Stack gap={2} className="admin-nav-tab-copy">
                <Text size="sm" fw={700} className="admin-nav-tab-label">
                  {tab.label}
                </Text>
                <Text size="xs" c="dimmed" className="admin-nav-tab-description">
                  {tab.description}
                </Text>
              </Stack>
            </UnstyledButton>
          );
        })}
      </Group>
    </Stack>
  );
}
