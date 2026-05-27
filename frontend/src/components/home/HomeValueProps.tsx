import { SimpleGrid, Stack, Text, ThemeIcon, Title } from "@mantine/core";
import { IconBolt, IconCalendarEvent, IconMapPin, IconTicket } from "@tabler/icons-react";
import { AnimatedSection } from "./AnimatedSection";
import { PremiumPaper } from "../account/PremiumPaper";

const VALUE_PROPS = [
  {
    icon: IconTicket,
    title: "Ingresso digital",
    description: "Receba seu QR Code assim que o PIX for confirmado — pronto para o check-in.",
    color: "brand",
  },
  {
    icon: IconBolt,
    title: "Pagamento rápido",
    description: "Reserva em segundos e confirmação automática. Sem burocracia na compra.",
    color: "yellow",
  },
  {
    icon: IconMapPin,
    title: "Eventos perto de você",
    description: "Explore por cidade e encontre experiências na sua região ou onde for viajar.",
    color: "grape",
  },
  {
    icon: IconCalendarEvent,
    title: "Vitrine sempre atualizada",
    description: "Novos eventos e lotes publicados pelos produtores em tempo real na plataforma.",
    color: "teal",
  },
] as const;

export function HomeValueProps() {
  return (
    <AnimatedSection delayMs={80}>
      <Stack gap="lg">
        <Stack gap={4} maw={520}>
          <Title order={2} size="h3" className="home-section-title">
            Por que escolher o TicketFlow
          </Title>
          <Text c="dimmed">
            Uma experiência pensada para quem quer descobrir eventos e garantir ingressos sem
            fricção.
          </Text>
        </Stack>

        <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
          {VALUE_PROPS.map((item) => (
            <PremiumPaper key={item.title} p="lg" className="home-value-card">
              <Stack gap="sm">
                <ThemeIcon size={44} radius="md" variant="light" color={item.color}>
                  <item.icon size={22} />
                </ThemeIcon>
                <Text fw={700} size="md">
                  {item.title}
                </Text>
                <Text size="sm" c="dimmed" style={{ lineHeight: 1.6 }}>
                  {item.description}
                </Text>
              </Stack>
            </PremiumPaper>
          ))}
        </SimpleGrid>
      </Stack>
    </AnimatedSection>
  );
}
