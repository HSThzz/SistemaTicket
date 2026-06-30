import { Link } from "react-router-dom";
import { Box, Button, Group, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconArrowRight, IconCalendarPlus } from "@tabler/icons-react";
import { AnimatedSection } from "@/shared/components/AnimatedSection";

export function HomeProducerCta() {
  return (
    <AnimatedSection delayMs={60}>
      <Box className="home-producer-cta">
        <Group justify="space-between" align="center" wrap="wrap" gap="xl">
          <Stack gap="sm" maw={480}>
            <ThemeIcon size={48} radius="xl" variant="light" color="white" className="home-producer-cta-icon">
              <IconCalendarPlus size={24} />
            </ThemeIcon>
            <Title order={3} c="white" style={{ letterSpacing: "-0.02em" }}>
              É produtor de eventos?
            </Title>
            <Text c="white" opacity={0.88} style={{ lineHeight: 1.65 }}>
              Crie eventos, configure lotes, acompanhe vendas e faça check-in com QR Code — tudo
              em um painel completo.
            </Text>
          </Stack>

          <Button
            component={Link}
            to="/produtor/eventos/novo"
            size="lg"
            radius="xl"
            variant="white"
            color="dark"
            rightSection={<IconArrowRight size={18} />}
          >
            Começar agora
          </Button>
        </Group>
      </Box>
    </AnimatedSection>
  );
}
