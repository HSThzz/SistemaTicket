import { Link } from "react-router-dom";
import {
  Anchor,
  Box,
  Container,
  Divider,
  Grid,
  Group,
  Stack,
  Text,
  ThemeIcon,
} from "@mantine/core";
import { IconBrandGithub, IconTicket } from "@tabler/icons-react";

const FOOTER_COLUMNS = [
  {
    title: "Explorar",
    links: [
      { label: "Eventos", to: "/" },
      { label: "Meus ingressos", to: "/ingressos" },
      { label: "Meus pedidos", to: "/pedidos" },
    ],
  },
  {
    title: "Produtor",
    links: [
      { label: "Painel do produtor", to: "/produtor" },
      { label: "Criar evento", to: "/produtor/eventos/novo" },
      { label: "Check-in", to: "/produtor/check-in" },
    ],
  },
  {
    title: "Conta",
    links: [
      { label: "Entrar", to: "/login" },
      { label: "Cadastrar", to: "/cadastro" },
    ],
  },
] as const;

export function SiteFooter() {
  return (
    <Box component="footer" className="site-footer" w="100%" pt={64} pb="xl" mt={64}>
      <Container size="lg" px="md">
        <Grid gap="xl">
          <Grid.Col span={{ base: 12, md: 4 }}>
            <Stack gap="md">
              <Group gap="xs">
                <ThemeIcon size={36} radius="md" variant="light" color="brand">
                  <IconTicket size={20} />
                </ThemeIcon>
                <Text fw={800} size="xl">
                  TicketFlow
                </Text>
              </Group>
              <Text c="dimmed" size="sm" maw={320}>
                Plataforma moderna para descobrir experiências, comprar ingressos com PIX e
                gerenciar eventos do início ao check-in.
              </Text>
              <Group gap="xs" c="dimmed">
                <IconBrandGithub size={16} />
                <Text size="xs">Demo · v1.0</Text>
              </Group>
            </Stack>
          </Grid.Col>

          {FOOTER_COLUMNS.map((column) => (
            <Grid.Col key={column.title} span={{ base: 6, sm: 4, md: 2 }}>
              <Stack gap="sm">
                <Text fw={700} size="sm">
                  {column.title}
                </Text>
                {column.links.map((link) => (
                  <Anchor
                    key={link.to}
                    component={Link}
                    to={link.to}
                    c="dimmed"
                    size="sm"
                    underline="never"
                    style={{ transition: "color 0.2s ease" }}
                  >
                    {link.label}
                  </Anchor>
                ))}
              </Stack>
            </Grid.Col>
          ))}
        </Grid>

        <Divider my="xl" opacity={0.6} />

        <Group justify="space-between" wrap="wrap" gap="sm">
          <Text size="xs" c="dimmed">
            © {new Date().getFullYear()} TicketFlow. Todos os direitos reservados.
          </Text>
          <Text size="xs" c="dimmed">
            Feito para experiências inesquecíveis.
          </Text>
        </Group>
      </Container>
    </Box>
  );
}
