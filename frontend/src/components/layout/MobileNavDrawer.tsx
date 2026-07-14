/**
 * @file Menu mobile estruturado por seções — menos ruído que links horizontais soltos.
 */

import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Box, Button, Divider, Stack, Text, ThemeIcon, UnstyledButton } from "@mantine/core";
import {
  IconCalendarPlus,
  IconHome,
  IconLayoutDashboard,
  IconLogout,
  IconScan,
  IconShield,
  IconTicket,
  IconUser,
} from "@tabler/icons-react";
import type { TablerIcon } from "@tabler/icons-react";

interface MobileNavDrawerProps {
  currentPath: string;
  isAuthenticated: boolean;
  isProducer: boolean;
  isAdmin: boolean;
  canCheckIn?: boolean;
  userName?: string;
  userEmail?: string;
  onNavigate: () => void;
  onLogout: () => void;
}

interface NavItem {
  to: string;
  label: string;
  icon: TablerIcon;
  exact?: boolean;
}

function NavSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Stack gap="xs" className="mobile-nav-section">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700} className="mobile-nav-section-title">
        {title}
      </Text>
      <Stack gap={4}>{children}</Stack>
    </Stack>
  );
}

function MobileNavItem({
  item,
  currentPath,
  onNavigate,
}: {
  item: NavItem;
  currentPath: string;
  onNavigate: () => void;
}) {
  const Icon = item.icon;
  const isActive = item.exact
    ? currentPath === item.to
    : currentPath === item.to || currentPath.startsWith(`${item.to}/`);

  return (
    <UnstyledButton
      component={Link}
      to={item.to}
      onClick={onNavigate}
      className={`mobile-nav-item${isActive ? " is-active" : ""}`}
    >
      <ThemeIcon size={34} radius="md" variant="light" color={isActive ? "brand" : "gray"}>
        <Icon size={18} />
      </ThemeIcon>
      <Text size="sm" fw={isActive ? 700 : 500}>
        {item.label}
      </Text>
    </UnstyledButton>
  );
}

const EXPLORE_LINKS: NavItem[] = [
  { to: "/", label: "Início", icon: IconHome, exact: true },
  { to: "/eventos", label: "Eventos", icon: IconTicket, exact: true },
  // { to: "/para-produtores", label: "Para produtores", icon: IconSparkles, exact: true },
];

const PRODUCER_LINKS: NavItem[] = [
  { to: "/produtor", label: "Dashboard", icon: IconLayoutDashboard, exact: true },
  { to: "/produtor/eventos", label: "Meus eventos", icon: IconTicket },
  { to: "/produtor/check-in", label: "Check-in", icon: IconScan },
];

/**
 * Drawer lateral do mobile com seções Explorar, Produtor e Conta.
 */
export function MobileNavDrawer({
  currentPath,
  isAuthenticated,
  isProducer,
  isAdmin,
  canCheckIn = false,
  userName,
  userEmail,
  onNavigate,
  onLogout,
}: MobileNavDrawerProps) {
  return (
    <Stack gap="lg" className="mobile-nav-drawer">
      {isAuthenticated && userName ? (
        <Box className="mobile-nav-user-card">
          <ThemeIcon size={42} radius="xl" variant="light" color="brand">
            <IconUser size={22} />
          </ThemeIcon>
          <Stack gap={2} flex={1} miw={0}>
            <Text fw={700} size="sm" lineClamp={1}>
              {userName}
            </Text>
            {userEmail ? (
              <Text size="xs" c="dimmed" lineClamp={1}>
                {userEmail}
              </Text>
            ) : null}
          </Stack>
        </Box>
      ) : null}

      <NavSection title="Explorar">
        {EXPLORE_LINKS.map((item) => (
          <MobileNavItem
            key={item.to}
            item={item}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        ))}
      </NavSection>

      {isProducer ? (
        <NavSection title="Produtor">
          {PRODUCER_LINKS.map((item) => (
            <MobileNavItem
              key={item.to}
              item={item}
              currentPath={currentPath}
              onNavigate={onNavigate}
            />
          ))}
          <Button
            component={Link}
            to="/produtor/eventos/novo"
            radius="xl"
            leftSection={<IconCalendarPlus size={18} />}
            onClick={onNavigate}
            mt={4}
            fullWidth
          >
            Criar evento
          </Button>
        </NavSection>
      ) : null}

      {!isProducer && canCheckIn ? (
        <NavSection title="Portaria">
          <MobileNavItem
            item={{ to: "/produtor/check-in", label: "Check-in", icon: IconScan, exact: true }}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        </NavSection>
      ) : null}

      {isAdmin ? (
        <NavSection title="Admin">
          <MobileNavItem
            item={{ to: "/admin", label: "Painel admin", icon: IconShield, exact: true }}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
        </NavSection>
      ) : null}

      <Divider className="mobile-nav-divider" />

      {isAuthenticated ? (
        <Stack gap="sm">
          <MobileNavItem
            item={{ to: "/perfil", label: "Minha conta", icon: IconUser }}
            currentPath={currentPath}
            onNavigate={onNavigate}
          />
          <Text size="xs" c="dimmed" px={4}>
            Ingressos, pedidos, favoritos e senha ficam na sua conta.
          </Text>
          <Button
            fullWidth
            variant="light"
            color="red"
            radius="xl"
            leftSection={<IconLogout size={16} />}
            onClick={onLogout}
          >
            Sair
          </Button>
        </Stack>
      ) : (
        <Stack gap="sm">
          <Button
            fullWidth
            variant="light"
            component={Link}
            to="/login"
            radius="xl"
            onClick={onNavigate}
          >
            Entrar
          </Button>
          <Button fullWidth component={Link} to="/cadastro" radius="xl" onClick={onNavigate}>
            Cadastrar
          </Button>
        </Stack>
      )}
    </Stack>
  );
}
