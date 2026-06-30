import { Badge, Box, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { IconBolt, IconQrcode, IconShieldCheck } from "@tabler/icons-react";
import { ZeMascot } from "@/modules/leads/features/contact/components/ZeMascot";

interface HomeHeroProps {
  eventCount: number;
}

const TRUST_BADGES = [
  { icon: IconBolt, label: "PIX instantâneo" },
  { icon: IconQrcode, label: "QR Code na hora" },
  { icon: IconShieldCheck, label: "Compra segura" },
] as const;

export function HomeHero({ eventCount }: HomeHeroProps) {
  return (
    <Box className="home-hero-stage" pos="relative">
      <Box className="home-hero-glow home-hero-glow--primary" />
      <Box className="home-hero-glow home-hero-glow--secondary" />

      <SimpleGrid cols={{ base: 1, md: 2 }} spacing="xl" pos="relative" style={{ zIndex: 1 }}>
        <Stack gap="xl">
          <Stack gap="md" maw={640}>
            <Text className="vibra-kicker">
              Ingressos · Shows · Cultura · Brasil
            </Text>

            <Badge
              variant="light"
              color="brand"
              radius="xl"
              size="lg"
              w="fit-content"
            >
              {eventCount > 0
                ? `${eventCount} experiência${eventCount === 1 ? "" : "s"} disponíve${eventCount === 1 ? "l" : "is"}`
                : "Novas experiências em breve"}
            </Badge>

            <Title order={1} className="home-hero-title">
              Ingressos do jeito que o{" "}
              <Text span inherit c="brand.7" className="home-hero-accent">
                Brasil merece.
              </Text>
            </Title>

            <Text c="dimmed" size="lg" style={{ lineHeight: 1.65 }}>
              A plataforma feita para o fã brasileiro. Shows, festivais e eventos exclusivos —
              com PIX na hora e o Zé te guiando em cada passo.
            </Text>
          </Stack>

          <Group gap="sm" wrap="wrap">
            {TRUST_BADGES.map((item) => (
              <Badge
                key={item.label}
                variant="outline"
                color="gray"
                radius="xl"
                size="lg"
                leftSection={<item.icon size={14} />}
                className="home-trust-badge"
              >
                {item.label}
              </Badge>
            ))}
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
  );
}
