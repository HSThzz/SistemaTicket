import { Box, Text } from "@mantine/core";
import { IconCoin, IconSparkles, IconUsers } from "@tabler/icons-react";
import { AnimatedSection } from "../home/AnimatedSection";
import { LandingDeviceStage } from "./LandingDeviceStage";
import { LandingFeatureList } from "./LandingFeatureList";
import { LandingShowcase } from "./LandingShowcase";
import { LandingVisualPanel } from "./LandingVisualPanel";
import { PhoneMockup } from "./PhoneMockup";

const FAN_FEATURES = [
  {
    icon: IconSparkles,
    title: "Algoritmo de gosto",
    description: "Recomendações baseadas no que você ouve — não no que está impulsionado.",
  },
  {
    icon: IconUsers,
    title: "Feed social de shows",
    description: "Fotos, perfis e descoberta pelo que a sua tribo está indo.",
  },
  {
    icon: IconCoin,
    title: "Cashback em cada compra",
    description: "Quando o mesmo show está em duas plataformas, você escolhe a VIBRA.",
  },
] as const;

export function LandingFeatures() {
  return (
    <>
      <AnimatedSection delayMs={40}>
        <Box className="landing-section landing-section--loose">
          <LandingShowcase
            flip
            visualBleed
            title="O que mais?"
            body={null}
            footer={<LandingFeatureList items={[...FAN_FEATURES]} activeIndex={1} />}
            visual={
              <LandingDeviceStage>
                <PhoneMockup screen="feed" />
              </LandingDeviceStage>
            }
          />
        </Box>
      </AnimatedSection>

      <AnimatedSection delayMs={60}>
        <Box className="landing-section landing-section--loose">
          <LandingShowcase
            titleClassName="landing-display-title landing-display-title--sm"
            title="Amado por quem vive música."
            body="&ldquo;Finalmente uma plataforma que entende que show é experiência social — não só checkout.&rdquo;"
            footer={
              <Text size="sm" c="dimmed" className="landing-showcase-credit">
                — Fã beta, São Paulo
              </Text>
            }
            visual={
              <LandingVisualPanel
                variant="social"
                label="Depoimentos"
                cards={[
                  { label: "Satisfação", value: "4.9", detail: "★ ★ ★ ★ ★" },
                  { label: "Recompra", value: "87%", detail: "voltariam a usar" },
                ]}
              />
            }
          />
        </Box>
      </AnimatedSection>

      <AnimatedSection delayMs={80}>
        <Box className="landing-section landing-section--loose">
          <LandingShowcase
            flip
            visualBleed
            kicker="Para o produtor"
            titleClassName="landing-display-title landing-display-title--sm"
            title={
              <>
                Não só vende.{" "}
                <Text span inherit className="landing-producer-accent">
                  Trabalha
                </Text>{" "}
                por você.
              </>
            }
            body="Taxa justa, caixa em D+3 e dashboard ao vivo."
            visual={
              <LandingVisualPanel
                variant="stats"
                items={[
                  { label: "Taxa", value: "8%", detail: "vs. 10–12% do mercado" },
                  { label: "Recebimento", value: "D+3", detail: "enquanto outros pagam D+30" },
                  { label: "Dashboard", value: "Live", detail: "vendas e público em tempo real" },
                ]}
              />
            }
          />
        </Box>
      </AnimatedSection>
    </>
  );
}
