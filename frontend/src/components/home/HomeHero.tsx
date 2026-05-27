import { Badge, Box, Group, Stack, Text, Title } from "@mantine/core";
import { IconBolt, IconQrcode, IconShieldCheck, IconSparkles } from "@tabler/icons-react";

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

      <Stack gap="xl" pos="relative" style={{ zIndex: 1 }}>
        <Stack gap="md" maw={640}>
          <Badge
            variant="light"
            color="brand"
            radius="xl"
            size="lg"
            leftSection={<IconSparkles size={14} />}
            w="fit-content"
          >
            {eventCount > 0
              ? `${eventCount} experiência${eventCount === 1 ? "" : "s"} disponíve${eventCount === 1 ? "l" : "is"}`
              : "Novas experiências em breve"}
          </Badge>

          <Title
            order={1}
            className="home-hero-title"
          >
            Descubra experiências{" "}
            <Text span inherit c="brand">
              incríveis
            </Text>
          </Title>

          <Text c="dimmed" size="lg" style={{ lineHeight: 1.65 }}>
            Shows, festivais e eventos exclusivos. Compre com PIX e receba seu ingresso digital
            na hora — sem filas, sem complicação.
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
    </Box>
  );
}
