import { Box, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";
import { PremiumPaper } from "../account/PremiumPaper";

const PROBLEMS = [
  {
    title: "Taxa absurda",
    body: 'Até 20% de "taxa de conveniência" em cima do preço do ingresso. Uma conveniente para quem? Para a plataforma — não para o fã.',
  },
  {
    title: "Zero personalização",
    body: "Você entra, busca, compra. Nenhuma plataforma sabe quem você é, o que você ouve ou quais shows vão importar para você.",
  },
  {
    title: "Sem comunidade",
    body: "Shows são experiências sociais. As plataformas atuais tratam a compra como transação — e terminam o relacionamento no PIX.",
  },
] as const;

export function LandingProblem() {
  return (
    <AnimatedSection>
      <Box className="landing-section">
        <Stack gap="xl">
          <Stack gap="sm" maw={640}>
            <Text className="vibra-kicker">O problema que ninguém resolveu</Text>
            <Title order={2} className="landing-section-title">
              O brasileiro ama shows.{" "}
              <Text span inherit c="brand.7">
                Odeia comprar ingresso.
              </Text>
            </Title>
            <Text c="dimmed" size="lg" style={{ lineHeight: 1.75 }}>
              Sympla e Ingresse existem há mais de 10 anos. Nenhuma das duas construiu amor de
              marca. São ferramentas. Não experiências.
            </Text>
          </Stack>

          <SimpleGrid cols={{ base: 1, md: 3 }} spacing="md">
            {PROBLEMS.map((item) => (
              <PremiumPaper key={item.title} p="lg" className="landing-card">
                <Stack gap="sm">
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

          <PremiumPaper p="xl" className="landing-stat-banner">
            <Text className="landing-stat-value">R$12bi+</Text>
            <Text c="dimmed" maw={480}>
              Mercado de eventos ao vivo no Brasil — sem uma plataforma que realmente ame o fã.
            </Text>
          </PremiumPaper>
        </Stack>
      </Box>
    </AnimatedSection>
  );
}
