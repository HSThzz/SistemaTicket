/**
 * @file Shell principal (AppShell) com navegação, menu do usuário e outlet de rotas.
 * @module components/Layout
 */

import { useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Burger,
  Button,
  Container,
  Drawer,
  Group,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCalendarPlus,
  IconChevronDown,
  IconUser,
} from "@tabler/icons-react";
import { VibraLogo } from "@/components/brand/VibraLogo";
import { ColorSchemeToggle } from "@/components/layout/ColorSchemeToggle";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { UserAccountMenu } from "@/components/layout/UserAccountMenu";
import { useAuth } from "@/modules/identity/context/AuthContext";
import { isProducerPanelRole, isStaffRole } from "@/modules/identity/utils/adminRoles";

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
            className={`desktop-nav-link${isActive ? " is-active" : ""}`}
            fw={isActive ? 600 : 500}
            underline="never"
            onClick={onNavigate}
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
  const isMobileNav = useMediaQuery("(max-width: 47.99em)");
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

  const isProducer = isProducerPanelRole(user?.role);
  const isAdmin = isStaffRole(user?.role);

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

  useEffect(() => {
    close();
  }, [location.pathname, close]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    if (!isMobileNav) {
      close();
    }
  }, [isMobileNav, close]);

  return (
    <AppShell
      header={{ height: 72 }}
      padding={isFullWidthPage ? 0 : "md"}
      className={layoutVariant ? `layout-${layoutVariant}` : undefined}
      classNames={{
        header: layoutVariant ? `layout-${layoutVariant}-header` : undefined,
        main: layoutVariant ? `layout-${layoutVariant}-main` : undefined,
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
                <UserAccountMenu
                  user={user}
                  isProducer={isProducer}
                  onNavigate={close}
                  onLogout={handleLogout}
                >
                  <Button
                    variant="light"
                    radius="xl"
                    rightSection={<IconChevronDown size={16} />}
                    leftSection={<IconUser size={16} />}
                    className="user-account-menu-trigger"
                  >
                    {user.name.split(" ")[0]}
                  </Button>
                </UserAccountMenu>
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

      <Drawer
        opened={opened && Boolean(isMobileNav)}
        onClose={close}
        position="left"
        size={300}
        padding="md"
        lockScroll
        withCloseButton={false}
        hiddenFrom="sm"
        classNames={{
          content: "layout-mobile-drawer",
          body: "layout-mobile-drawer-body",
          overlay: "layout-mobile-drawer-overlay",
        }}
        transitionProps={{ transition: "slide-right", duration: 220 }}
        aria-label="Menu de navegação"
      >
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
      </Drawer>

      <AppShell.Main className={opened && isMobileNav ? "layout-main-nav-locked" : undefined}>
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
