import { Link } from "react-router-dom";
import { Box, Button, Group, Stack, Text, Title } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { AnimatedSection } from "../home/AnimatedSection";
import { ZeMascot } from "../brand/ZeMascot";

export function LandingCta() {
  return (
    <AnimatedSection delayMs={60}>
      <Box className="landing-section landing-final-cta">
        <Group justify="space-between" align="flex-end" wrap="wrap" gap="xl">
          <Stack gap="lg" maw={520}>
            <Text className="vibra-kicker">Vamos junto</Text>
            <Title order={2} className="landing-final-title">
              O Zé tá pronto.{" "}
              <Text span inherit c="brand.7">
                E você?
              </Text>
            </Title>
            <Text c="dimmed" size="lg" style={{ lineHeight: 1.7 }}>
              Descubra shows, compre com PIX e receba seu ingresso na hora. A experiência começa
              agora.
            </Text>
            <Group gap="sm">
              <Button
                component={Link}
                to="/eventos"
                size="lg"
                radius="xl"
                rightSection={<IconArrowRight size={18} />}
              >
                Explorar eventos
              </Button>
              <Button
                component={Link}
                to="/produtor/eventos/novo"
                size="lg"
                radius="xl"
                variant="outline"
              >
                Sou produtor
              </Button>
            </Group>
          </Stack>

          <Box visibleFrom="sm" style={{ opacity: 0.85 }}>
            <ZeMascot size={120} animated={false} variant="dark" />
          </Box>
        </Group>
      </Box>
    </AnimatedSection>
  );
}
