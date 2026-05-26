import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Box,
  Burger,
  Button,
  Container,
  Group,
  Menu,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconCalendarPlus,
  IconChevronDown,
  IconLayoutDashboard,
  IconLogout,
  IconTicket,
  IconUser,
} from "@tabler/icons-react";
import { ColorSchemeToggle } from "./ColorSchemeToggle";
import { useAuth } from "../context/AuthContext";

const CLIENT_NAV_LINKS = [
  { to: "/", label: "Eventos", icon: null },
  { to: "/ingressos", label: "Meus ingressos", icon: IconTicket },
  { to: "/pedidos", label: "Meus pedidos", icon: null },
] as const;

function NavLinks({
  onNavigate,
  currentPath,
  isProducer,
}: {
  onNavigate?: () => void;
  currentPath: string;
  isProducer: boolean;
}) {
  const links = isProducer
    ? [...CLIENT_NAV_LINKS, { to: "/produtor", label: "Produtor", icon: IconLayoutDashboard } as const]
    : CLIENT_NAV_LINKS;

  return (
    <Group gap="lg">
      {links.map((link) => {
        const isActive =
          link.to === "/" ? currentPath === "/" : currentPath.startsWith(link.to);

        return (
          <Anchor
            key={link.to}
            component={Link}
            to={link.to}
            fw={isActive ? 600 : 500}
            c={isActive ? "brand.6" : "dimmed"}
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

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, isAuthenticated, isBootstrapping, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;
  const isHome = currentPath === "/";
  const isFullWidthPage =
    isHome ||
    /^\/eventos\/[^/]+$/.test(currentPath) ||
    /^\/produtor\/eventos\/[^/]+$/.test(currentPath) ||
    currentPath === "/produtor/check-in";

  const isProducer = user?.role === "PRODUCER" || user?.role === "ADMIN";

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
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: true },
      }}
      padding={isHome ? 0 : "md"}
      className={isHome ? "layout-home" : undefined}
      classNames={{
        header: isHome ? "home-hero-bg layout-home-header" : undefined,
        main: isHome ? "layout-home-main" : undefined,
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
                <Group gap="xs" wrap="nowrap">
                  <Box
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "linear-gradient(135deg, var(--mantine-color-brand-5), var(--mantine-color-brand-7))",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <IconTicket size={20} color="white" stroke={1.8} />
                  </Box>
                  <Text fw={800} size="lg" visibleFrom="xs" style={{ letterSpacing: "-0.02em" }}>
                    TicketFlow
                  </Text>
                </Group>
              </UnstyledButton>
            </Group>

            <Group gap="lg" visibleFrom="sm">
              <NavLinks onNavigate={close} currentPath={currentPath} isProducer={isProducer} />
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
                <Menu shadow="md" width={220} position="bottom-end">
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
        <Stack gap="md">
          <NavLinks onNavigate={close} currentPath={currentPath} isProducer={isProducer} />
          {isProducer ? (
            <Button
              component={Link}
              to="/produtor/eventos/novo"
              leftSection={<IconCalendarPlus size={16} />}
              onClick={close}
            >
              Criar evento
            </Button>
          ) : null}
          <Box pt="sm">
            {isAuthenticated && user ? (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {user.name}
                </Text>
                {isProducer ? (
                  <Button
                    fullWidth
                    variant="light"
                    component={Link}
                    to="/produtor"
                    onClick={close}
                    leftSection={<IconLayoutDashboard size={16} />}
                  >
                    Painel produtor
                  </Button>
                ) : null}
                <Button
                  fullWidth
                  variant="light"
                  color="red"
                  leftSection={<IconLogout size={16} />}
                  onClick={handleLogout}
                >
                  Sair
                </Button>
              </Stack>
            ) : (
              <Stack gap="xs">
                <Button fullWidth variant="light" component={Link} to="/login" onClick={close}>
                  Entrar
                </Button>
                <Button fullWidth component={Link} to="/cadastro" onClick={close}>
                  Cadastrar
                </Button>
              </Stack>
            )}
          </Box>
        </Stack>
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
