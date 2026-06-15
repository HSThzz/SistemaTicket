/**
 * @file Shell principal (AppShell) com navegação, menu do usuário e outlet de rotas.
 * @module components/Layout
 */

import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Burger,
  Button,
  Container,
  Group,
  Menu,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCalendarPlus,
  IconChevronDown,
  IconLayoutDashboard,
  IconLogout,
  IconUser,
} from "@tabler/icons-react";
import { VibraLogo } from "./brand/VibraLogo";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { MobileNavDrawer } from "./layout/MobileNavDrawer";
import { useAuth } from "../context/AuthContext";

const PUBLIC_NAV_LINKS = [
  { to: "/", label: "Início", exact: true },
  { to: "/eventos", label: "Eventos", exact: true },
  { to: "/para-produtores", label: "Para produtores", exact: true },
] as const;

/**
 * Links de navegação principal no header desktop.
 */
function DesktopNavLinks({
  onNavigate,
  currentPath,
  isProducer,
  isAdmin,
}: {
  onNavigate?: () => void;
  currentPath: string;
  isProducer: boolean;
  isAdmin: boolean;
}) {
  const links = [
    ...PUBLIC_NAV_LINKS,
    ...(isProducer ? [{ to: "/produtor", label: "Produtor", exact: false } as const] : []),
    ...(isAdmin ? [{ to: "/admin", label: "Admin", exact: false } as const] : []),
  ];

  return (
    <Group gap="lg">
      {links.map((link) => {
        const isActive = link.exact
          ? currentPath === link.to
          : currentPath === link.to || currentPath.startsWith(`${link.to}/`);

        return (
          <Anchor
            key={link.to}
            component={Link}
            to={link.to}
            fw={isActive ? 600 : 500}
            c={isActive ? "brand.7" : "dimmed"}
            underline="never"
            onClick={onNavigate}
            style={{
              transition: "color 0.2s ease",
              fontSize: "var(--mantine-font-size-sm)",
            }}
          >
            {link.label}
          </Anchor>
        );
      })}
    </Group>
  );
}

/**
 * Layout global com cabeçalho VIBRA, navegação responsiva e área de conteúdo.
 */
export function Layout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, isAuthenticated, isBootstrapping, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isHome = currentPath === "/";
  const isEventsPage = currentPath === "/eventos";
  const isHeroPage =
    /^\/eventos\/[^/]+$/.test(currentPath) ||
    /^\/eventos\/[^/]+\/comprar$/.test(currentPath) ||
    /^\/produtor\/eventos\/[^/]+$/.test(currentPath) ||
    currentPath === "/produtor/check-in" ||
    currentPath === "/produtor/eventos/novo";
  const isFullWidthPage = isHome || isEventsPage || isHeroPage;
  const layoutVariant = isHome ? "home" : isEventsPage ? "events" : isHeroPage ? "hero" : undefined;

  const isProducer = user?.role === "PRODUCER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  const handleLogout = () => {
    clearSession();
    close();
    notifications.show({
      title: "Sessão encerrada",
      message: "Até logo!",
      color: "gray",
    });
    navigate("/");
  };

  return (
    <AppShell
      header={{ height: 72 }}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: true },
      }}
      padding={isFullWidthPage ? 0 : "md"}
      className={layoutVariant ? `layout-${layoutVariant}` : undefined}
      classNames={{
        header: layoutVariant ? `layout-${layoutVariant}-header` : undefined,
        main: layoutVariant ? `layout-${layoutVariant}-main` : undefined,
        navbar: "layout-mobile-navbar",
      }}
    >
      <AppShell.Header>
        <Container size="lg" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="sm" wrap="nowrap">
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
                aria-label="Abrir menu"
              />
              <UnstyledButton component={Link} to="/" onClick={close}>
                <VibraLogo mascotSize={28} wordmarkSize="md" />
              </UnstyledButton>
            </Group>

            <Group gap="lg" visibleFrom="sm">
              <DesktopNavLinks
                onNavigate={close}
                currentPath={currentPath}
                isProducer={isProducer}
                isAdmin={isAdmin}
              />
            </Group>

            <Group gap="sm" wrap="nowrap">
              {isProducer ? (
                <Button
                  component={Link}
                  to="/produtor/eventos/novo"
                  variant="light"
                  size="xs"
                  leftSection={<IconCalendarPlus size={16} />}
                  visibleFrom="md"
                  onClick={close}
                >
                  Criar evento
                </Button>
              ) : null}

              <ColorSchemeToggle />

              {isBootstrapping ? (
                <Button variant="light" loading size="sm">
                  ...
                </Button>
              ) : isAuthenticated && user ? (
                <Menu shadow="md" width={240} position="bottom-end">
                  <Menu.Target>
                    <Button
                      variant="light"
                      radius="xl"
                      rightSection={<IconChevronDown size={16} />}
                      leftSection={<IconUser size={16} />}
                    >
                      {user.name.split(" ")[0]}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>{user.email}</Menu.Label>
                    <Menu.Item
                      component={Link}
                      to="/perfil"
                      leftSection={<IconUser size={16} />}
                      onClick={close}
                    >
                      Minha conta
                    </Menu.Item>
                    <Menu.Label>Ingressos e pedidos</Menu.Label>
                    <Menu.Item
                      component={Link}
                      to="/ingressos"
                      onClick={close}
                    >
                      Meus ingressos
                    </Menu.Item>
                    <Menu.Item
                      component={Link}
                      to="/pedidos"
                      onClick={close}
                    >
                      Meus pedidos
                    </Menu.Item>
                    {isProducer ? (
                      <Menu.Item
                        component={Link}
                        to="/produtor"
                        leftSection={<IconLayoutDashboard size={16} />}
                        onClick={close}
                      >
                        Painel produtor
                      </Menu.Item>
                    ) : null}
                    <Menu.Divider />
                    <Menu.Item leftSection={<IconLogout size={16} />} onClick={handleLogout}>
                      Sair
                    </Menu.Item>
                  </Menu.Dropdown>
                </Menu>
              ) : (
                <>
                  <Button
                    variant="subtle"
                    component={Link}
                    to="/login"
                    visibleFrom="xs"
                    onClick={close}
                  >
                    Entrar
                  </Button>
                  <Button component={Link} to="/cadastro" radius="xl" onClick={close}>
                    Cadastrar
                  </Button>
                </>
              )}
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Navbar p="md" hiddenFrom="sm">
        <MobileNavDrawer
          currentPath={currentPath}
          isAuthenticated={isAuthenticated}
          isProducer={isProducer}
          isAdmin={isAdmin}
          userName={user?.name}
          userEmail={user?.email}
          onNavigate={close}
          onLogout={handleLogout}
        />
      </AppShell.Navbar>

      <AppShell.Main>
        {isFullWidthPage ? (
          <Outlet />
        ) : (
          <Container size="lg" py="md">
            <Outlet />
          </Container>
        )}
      </AppShell.Main>
    </AppShell>
  );
}
