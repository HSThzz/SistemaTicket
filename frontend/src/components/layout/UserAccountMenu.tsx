/**
 * @file Menu dropdown da conta no header desktop.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Box, Menu, Stack, Text, ThemeIcon } from "@mantine/core";
import {
  IconLayoutDashboard,
  IconLogout,
  IconReceipt2,
  IconTicket,
  IconUser,
} from "@tabler/icons-react";
import type { AuthUser } from "@/shared/types/api";

interface UserAccountMenuProps {
  user: AuthUser;
  isProducer: boolean;
  onNavigate: () => void;
  onLogout: () => void;
  children: ReactNode;
}

/**
 * Dropdown estilizado com cabeçalho de usuário e links agrupados.
 */
export function UserAccountMenu({
  user,
  isProducer,
  onNavigate,
  onLogout,
  children,
}: UserAccountMenuProps) {
  return (
    <Menu
      shadow="lg"
      width={280}
      position="bottom-end"
      offset={8}
      classNames={{
        dropdown: "user-account-menu-dropdown",
        item: "user-account-menu-item",
        label: "user-account-menu-label",
        divider: "user-account-menu-divider",
      }}
    >
      <Menu.Target>{children}</Menu.Target>

      <Menu.Dropdown>
        <Box className="user-account-menu-header">
          <ThemeIcon size={40} radius="xl" variant="light" color="brand" className="user-account-menu-avatar">
            <IconUser size={20} />
          </ThemeIcon>
          <Stack gap={3} flex={1} miw={0} className="user-account-menu-identity">
            <Text fw={700} size="sm" lineClamp={1} title={user.name}>
              {user.name}
            </Text>
            <Text
              size="xs"
              c="dimmed"
              className="user-account-menu-email"
              title={user.email}
            >
              {user.email}
            </Text>
          </Stack>
        </Box>

        <Menu.Divider />

        <Menu.Label>Conta</Menu.Label>
        <Menu.Item
          component={Link}
          to="/perfil"
          leftSection={<IconUser size={16} />}
          onClick={onNavigate}
        >
          Minha conta
        </Menu.Item>

        <Menu.Label>Compras</Menu.Label>
        <Menu.Item
          component={Link}
          to="/ingressos"
          leftSection={<IconTicket size={16} />}
          onClick={onNavigate}
        >
          Meus ingressos
        </Menu.Item>
        <Menu.Item
          component={Link}
          to="/pedidos"
          leftSection={<IconReceipt2 size={16} />}
          onClick={onNavigate}
        >
          Meus pedidos
        </Menu.Item>

        {isProducer ? (
          <>
            <Menu.Label>Produtor</Menu.Label>
            <Menu.Item
              component={Link}
              to="/produtor"
              leftSection={<IconLayoutDashboard size={16} />}
              onClick={onNavigate}
            >
              Painel produtor
            </Menu.Item>
          </>
        ) : null}

        <Menu.Divider />

        <Menu.Item
          leftSection={<IconLogout size={16} />}
          onClick={onLogout}
          color="red"
          className="user-account-menu-logout"
        >
          Sair
        </Menu.Item>
      </Menu.Dropdown>
    </Menu>
  );
}
