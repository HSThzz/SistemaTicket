/**
 * @file Atalhos da conta — ingressos e pedidos centralizados no perfil.
 */

import { Link } from "react-router-dom";
import { Group, SimpleGrid, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import { IconChevronRight, IconReceipt2, IconTicket } from "@tabler/icons-react";
import { PremiumPaper } from "./PremiumPaper";

const LINKS = [
  {
    to: "/ingressos",
    label: "Meus ingressos",
    description: "Carteira digital e QR codes",
    icon: IconTicket,
    color: "teal",
  },
  {
    to: "/pedidos",
    label: "Meus pedidos",
    description: "Histórico e pagamentos",
    icon: IconReceipt2,
    color: "blue",
  },
] as const;

/**
 * Cards de acesso rápido a compras — substitui links soltos na navbar.
 */
export function AccountQuickLinks() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md" className="account-quick-links">
      {LINKS.map((link) => {
        const Icon = link.icon;

        return (
          <UnstyledButton
            key={link.to}
            component={Link}
            to={link.to}
            className="account-quick-link"
          >
            <PremiumPaper p="md" className="account-quick-link-card">
              <Group justify="space-between" align="center" wrap="nowrap" gap="md">
                <Group gap="md" wrap="nowrap" flex={1} miw={0}>
                  <ThemeIcon size={42} radius="md" variant="light" color={link.color}>
                    <Icon size={22} />
                  </ThemeIcon>
                  <Stack gap={2} flex={1} miw={0}>
                    <Text fw={700} size="sm">
                      {link.label}
                    </Text>
                    <Text size="xs" c="dimmed" lineClamp={1}>
                      {link.description}
                    </Text>
                  </Stack>
                </Group>
                <IconChevronRight size={18} color="var(--mantine-color-dimmed)" />
              </Group>
            </PremiumPaper>
          </UnstyledButton>
        );
      })}
    </SimpleGrid>
  );
}
