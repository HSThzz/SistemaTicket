import { Box, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";
import { PremiumPaper } from "../account/PremiumPaper";

const FAN_FEATURES = [
  { num: "01", title: "Spotify Connect", body: "Conecta sua conta e a VIBRA descobre seus artistas automaticamente." },
  { num: "02", title: "Algoritmo de gosto", body: "Recomendações baseadas no que você realmente ouve — não no que está sendo impulsionado." },
  { num: "03", title: "Feed Social", body: "Poste fotos do show, siga quem tem o mesmo gosto, descubra eventos pelo feed." },
  { num: "04", title: "Cashback", body: "Créditos a cada compra. Quando o mesmo show está em duas plataformas, você escolhe a VIBRA." },
  { num: "05", title: "Anti-Revenda", body: "Ingresso nominal, lista de espera justa, sem cambista digital." },
  { num: "06", title: "Zé, o Bilhete", body: "O personagem que guia cada etapa — da descoberta à confirmação." },
] as const;

const PRODUCER_FEATURES = [
  { title: "Taxa de 8%", body: "Sympla e Ingresse cobram até 10–12%. Na VIBRA, o produtor fica com mais — e o fã paga menos." },
  { title: "Recebimento D+3", body: "Enquanto o mercado paga em D+30 ou D+60, o produtor da VIBRA recebe em 3 dias úteis." },
  { title: "Dashboard intuitivo", body: "Vendas em tempo real, perfil do público, horário de pico, origem do tráfego." },
] as const;

export function LandingFeatures() {
  return (
    <>
      <AnimatedSection delayMs={40}>
        <Box className="landing-section">
          <Stack gap="xl">
            <Stack gap="sm" maw={520}>
              <Text className="vibra-kicker">Para o fã</Text>
              <Title order={2} className="landing-section-title">
                Tudo que o fã sempre quis.{" "}
                <Text span inherit c="brand.7">
                  Num lugar só.
                </Text>
              </Title>
            </Stack>

            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
              {FAN_FEATURES.map((item) => (
                <PremiumPaper key={item.title} p="lg" className="landing-card">
                  <Stack gap="sm">
                    <Text className="vibra-kicker" style={{ letterSpacing: "0.2em" }}>
                      {item.num}
                    </Text>
                    <Text fw={700} className="landing-card-title">
                      {item.title}
                    </Text>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
                      {item.body}
                    </Text>
                  </Stack>
                </PremiumPaper>
              ))}
            </SimpleGrid>
          </Stack>
        </Box>
      </AnimatedSection>

      <AnimatedSection delayMs={80}>
        <Box className="landing-section landing-section--muted">
          <Stack gap="xl">
            <Stack gap="sm" maw={520}>
              <Text className="vibra-kicker">Para o produtor</Text>
              <Title order={2} className="landing-section-title">
                Não só vende por você.{" "}
                <Text span inherit style={{ textDecoration: "underline", textDecorationColor: "var(--vibra-laranja)" }}>
                  Trabalha
                </Text>{" "}
                por você.
              </Title>
            </Stack>

            <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
              {PRODUCER_FEATURES.map((item) => (
                <PremiumPaper key={item.title} p="lg" className="landing-card landing-card--producer">
                  <Stack gap="sm">
                    <Text fw={700} c="orange" className="landing-card-title">
                      {item.title}
                    </Text>
                    <Text size="sm" c="dimmed" style={{ lineHeight: 1.65 }}>
                      {item.body}
                    </Text>
                  </Stack>
                </PremiumPaper>
              ))}
            </SimpleGrid>
          </Stack>
        </Box>
      </AnimatedSection>
    </>
  );
}
