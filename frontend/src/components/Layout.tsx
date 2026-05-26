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
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import { IconChevronDown, IconLogout, IconTicket, IconUser } from "@tabler/icons-react";
import { useAuth } from "../context/AuthContext";

const NAV_LINKS = [
  { to: "/", label: "Eventos" },
  { to: "/ingressos", label: "Meus ingressos" },
  { to: "/pedidos", label: "Meus pedidos" },
] as const;

function NavLinks({
  onNavigate,
  currentPath,
}: {
  onNavigate?: () => void;
  currentPath: string;
}) {
  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive =
          link.to === "/"
            ? currentPath === "/"
            : currentPath.startsWith(link.to);

        return (
          <Anchor
            key={link.to}
            component={Link}
            to={link.to}
            fw={isActive ? 600 : 500}
            c={isActive ? "brand.6" : "dimmed"}
            underline="never"
            onClick={onNavigate}
          >
            {link.label}
          </Anchor>
        );
      })}
    </>
  );
}

export function Layout() {
  const [opened, { toggle, close }] = useDisclosure();
  const { user, isAuthenticated, isBootstrapping, clearSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

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
      header={{ height: 64 }}
      navbar={{
        width: 280,
        breakpoint: "sm",
        collapsed: { mobile: !opened },
      }}
      padding="md"
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
              <Anchor component={Link} to="/" underline="never" c="inherit" onClick={close}>
                <Group gap="xs" wrap="nowrap">
                  <IconTicket size={28} stroke={1.6} color="var(--mantine-color-brand-6)" />
                  <Text fw={700} size="lg" visibleFrom="xs">
                    TicketFlow
                  </Text>
                </Group>
              </Anchor>
            </Group>

            <Group gap="lg" visibleFrom="sm">
              <NavLinks onNavigate={close} currentPath={currentPath} />
            </Group>

            <Group gap="sm" wrap="nowrap">
              {isBootstrapping ? (
                <Button variant="light" loading size="sm">
                  Carregando
                </Button>
              ) : isAuthenticated && user ? (
                <Menu shadow="md" width={200} position="bottom-end">
                  <Menu.Target>
                    <Button
                      variant="light"
                      rightSection={<IconChevronDown size={16} />}
                      leftSection={<IconUser size={16} />}
                    >
                      {user.name.split(" ")[0]}
                    </Button>
                  </Menu.Target>
                  <Menu.Dropdown>
                    <Menu.Label>{user.email}</Menu.Label>
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
                  <Button component={Link} to="/cadastro" onClick={close}>
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
          <NavLinks onNavigate={close} currentPath={currentPath} />
          <Box pt="sm">
            {isAuthenticated && user ? (
              <Stack gap="xs">
                <Text size="sm" c="dimmed">
                  {user.name}
                </Text>
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
        <Container size="lg" py="md">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
