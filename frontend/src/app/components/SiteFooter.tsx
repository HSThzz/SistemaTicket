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
} from "@mantine/core";
import { VibraLogo } from "@/components/brand/VibraLogo";

const FOOTER_COLUMNS = [
  {
    title: "Explorar",
    links: [
      { label: "Início", to: "/" },
      { label: "Eventos", to: "/eventos" },
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
              <VibraLogo mascotSize={36} wordmarkSize="lg" />
              <Text c="dimmed" size="sm" maw={320}>
                A plataforma de ingressos feita para o fã brasileiro. Com alma, com tecnologia,
                com o Zé.
              </Text>
              <Text className="vibra-kicker" style={{ letterSpacing: "0.2em" }}>
                "Ingressos do jeito que o Brasil merece."
              </Text>
            </Stack>
          </Grid.Col>

          {FOOTER_COLUMNS.map((column) => (
            <Grid.Col key={column.title} span={{ base: 6, sm: 4, md: 2 }}>
              <Stack gap="sm">
                <Text fw={700} size="sm" className="vibra-kicker" style={{ letterSpacing: "0.15em" }}>
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
            © {new Date().getFullYear()} VIBRA. Todos os direitos reservados.
          </Text>
          <Text size="xs" c="dimmed">
            Feito para experiências inesquecíveis.
          </Text>
        </Group>
      </Container>
    </Box>
  );
}
