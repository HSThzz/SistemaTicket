import { Link } from "react-router-dom";
import { Box, Button, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { LandingMascotPanel } from "./LandingMascotPanel";

export function LandingHero() {
  return (
    <Box className="landing-hero home-hero-bg home-hero-section" w="100%">
      <Box className="landing-hero-inner landing-hero-split">
        <Stack gap="xl" className="landing-hero-copy" justify="center">
          <Box className="landing-hero-stat" aria-label="Mercado de eventos ao vivo no Brasil">
            <Text component="span" className="landing-hero-stat-value">
              R$12bi+
            </Text>
            <Text component="span" className="landing-hero-stat-label">
              mercado ao vivo no Brasil
            </Text>
          </Box>

          <Title order={1} className="landing-hero-title landing-display-title" style={{ textAlign: "left" }}>
            <span style={{ display: "block", whiteSpace: "nowrap" }}>Bem-vindo à</span>
            <Text span inherit className="landing-hero-accent" style={{ display: "block" }}>
              VIBRA
            </Text>
          </Title>

          <Text size="lg" c="dimmed" maw={440} className="landing-hero-lead">
            A plataforma de ingressos feita pro fã brasileiro — com alma, tecnologia e o Zé.
          </Text>

          <Button
            component={Link}
            to="/eventos"
            size="lg"
            radius="xl"
            className="landing-pill-cta"
            rightSection={<IconArrowRight size={18} />}
          >
            Ver eventos
          </Button>
        </Stack>

        <Box visibleFrom="md">
          <LandingMascotPanel
            variant="hero"
            size={200}
            label="Zé · O Mascote Oficial"
          />
        </Box>
      </Box>
    </Box>
  );
}
