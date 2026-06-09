import { Box, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";
import { PremiumPaper } from "../account/PremiumPaper";

const SOLUTIONS = [
  {
    emoji: "🎵",
    title: "Conecta com seu gosto",
    body: "Integração com Spotify: a VIBRA sabe seus artistas antes de você precisar procurar. Alertas automáticos, recomendações reais.",
  },
  {
    emoji: "🌐",
    title: "É uma comunidade",
    body: "Feed social de eventos, fotos de shows, seguir perfis — a tribo existe dentro do app. Antes, durante e depois da noite.",
  },
  {
    emoji: "💰",
    title: "Vantagem que acumula",
    body: "Cashback em ingressos. Quando o mesmo show está em duas plataformas, o fã escolhe a VIBRA — porque faz sentido financeiro.",
  },
] as const;

export function LandingSolution() {
  return (
    <AnimatedSection delayMs={60}>
      <Box className="landing-section landing-section--accent">
        <Stack gap="xl">
          <Stack gap="sm" maw={640}>
            <Text className="vibra-kicker">Nossa resposta</Text>
            <Title order={2} className="landing-section-title">
              A DICE aconteceu no Reino Unido.{" "}
              <Text span inherit c="brand.7">
                Agora acontece aqui.
              </Text>
            </Title>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {SOLUTIONS.map((item) => (
              <PremiumPaper key={item.title} p="lg" className="landing-card landing-card--accent">
                <Stack gap="sm">
                  <Text fz={28}>{item.emoji}</Text>
                  <Text fw={700} className="landing-card-title">
                    {item.title}
                  </Text>
                  <Text size="sm" c="dimmed" style={{ lineHeight: 1.7 }}>
                    {item.body}
                  </Text>
                </Stack>
              </PremiumPaper>
            ))}
          </SimpleGrid>

          <Box className="landing-quote-banner">
            <Text className="landing-quote-text">
              "Ingressos do jeito que o Brasil merece."
            </Text>
            <Text size="sm" className="landing-quote-sub">
              Não somos um app americano localizado. Somos brasileiros — entendemos o forró, o
              funk, o axé, o jazz e o metal igualmente.
            </Text>
          </Box>
        </Stack>
      </Box>
    </AnimatedSection>
  );
}
