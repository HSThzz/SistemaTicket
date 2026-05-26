import { Link, Outlet, useLocation } from "react-router-dom";
import {
  Anchor,
  AppShell,
  Box,
  Burger,
  Button,
  Container,
  Group,
  Stack,
  Text,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconTicket } from "@tabler/icons-react";
import { useAuthToken } from "../hooks/useAuthToken";

const NAV_LINKS = [
  { to: "/", label: "Eventos" },
  { to: "/ingressos", label: "Meus ingressos" },
  { to: "/pedidos", label: "Meus pedidos" },
] as const;

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <>
      {NAV_LINKS.map((link) => {
        const isActive =
          link.to === "/"
            ? location.pathname === "/"
            : location.pathname.startsWith(link.to);

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
  const token = useAuthToken();
  const isLoggedIn = Boolean(token);

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
              <Anchor
                component={Link}
                to="/"
                underline="never"
                c="inherit"
                onClick={close}
              >
                <Group gap="xs" wrap="nowrap">
                  <IconTicket size={28} stroke={1.6} color="var(--mantine-color-brand-6)" />
                  <Text fw={700} size="lg" visibleFrom="xs">
                    TicketFlow
                  </Text>
                </Group>
              </Anchor>
            </Group>

            <Group gap="lg" visibleFrom="sm">
              <NavLinks onNavigate={close} />
            </Group>

            <Group gap="sm" wrap="nowrap">
              {isLoggedIn ? (
                <Button variant="light" component={Link} to="/conta" onClick={close}>
                  Minha conta
                </Button>
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
          <NavLinks onNavigate={close} />
          <Box pt="sm">
            {isLoggedIn ? (
              <Button fullWidth variant="light" component={Link} to="/conta" onClick={close}>
                Minha conta
              </Button>
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
