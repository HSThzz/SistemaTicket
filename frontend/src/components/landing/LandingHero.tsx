import { Link } from "react-router-dom";
import { Badge, Box, Button, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { ZeMascot } from "../brand/ZeMascot";

export function LandingHero() {
  return (
    <Box className="landing-hero home-hero-bg home-hero-section" w="100%">
      <Box className="landing-hero-inner">
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl">
          <Stack gap="xl" justify="center">
            <Text className="vibra-kicker">Pitch Deck · Brasil 2025</Text>

            <Stack gap="md" maw={560}>
              <Title order={1} className="landing-hero-title">
                A plataforma de ingressos feita para o{" "}
                <Text span inherit className="landing-hero-accent">
                  fã brasileiro.
                </Text>
              </Title>

              <Text size="lg" c="dimmed" style={{ lineHeight: 1.75 }}>
                Com alma, com tecnologia, com o Zé. Shows, festivais e cultura — ingressos do
                jeito que o Brasil merece.
              </Text>
            </Stack>

            <Group gap="sm" wrap="wrap">
              <Button
                component={Link}
                to="/eventos"
                size="lg"
                radius="xl"
                rightSection={<IconArrowRight size={18} />}
              >
                Ver eventos
              </Button>
              <Button
                component={Link}
                to="/cadastro"
                size="lg"
                radius="xl"
                variant="outline"
              >
                Criar conta
              </Button>
            </Group>

            <Group gap="xs" wrap="wrap">
              <Badge variant="outline" color="gray" radius="xl">
                Ingressos
              </Badge>
              <Badge variant="outline" color="gray" radius="xl">
                Shows
              </Badge>
              <Badge variant="outline" color="gray" radius="xl">
                Cultura
              </Badge>
              <Badge variant="outline" color="gray" radius="xl">
                Brasil
              </Badge>
            </Group>
          </Stack>

          <Box className="home-hero-mascot" visibleFrom="md">
            <Box className="home-hero-mascot-panel">
              <ZeMascot size={200} animated variant="dark" />
              <Text className="home-hero-mascot-label">Zé · O Mascote Oficial</Text>
            </Box>
          </Box>
        </SimpleGrid>
      </Box>
    </Box>
  );
}
