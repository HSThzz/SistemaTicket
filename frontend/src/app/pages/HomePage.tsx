/**
 * @file Página de apresentação da VIBRA (landing institucional).
 * @module pages/HomePage
 */

import { Box, Button, Stack, Text, Title } from "@mantine/core";
import { Link } from "react-router-dom";
import { IconArrowRight, IconCalendarPlus } from "@tabler/icons-react";
import { FaqSection } from "@/app/components/FaqSection";
import { SiteFooter } from "@/app/components/SiteFooter";
import { LandingCta } from "@/app/components/LandingCta";
import { LandingEaseBand } from "@/app/components/LandingEaseBand";
import { LandingFeatures } from "@/app/components/LandingFeatures";
import { LandingHero } from "@/app/components/LandingHero";
import { LandingPartnerStrip } from "@/app/components/LandingPartnerStrip";
import { LandingProblem } from "@/app/components/LandingProblem";
import { LandingSolution } from "@/app/components/LandingSolution";
import { AnimatedSection } from "@/shared/components/AnimatedSection";

/**
 * Landing page institucional com conteúdo do pitch deck VIBRA.
 * A vitrine de eventos fica em {@link EventsPage} (`/eventos`).
 */
export function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingEaseBand />

      <Stack gap={0}>
        <LandingProblem />
        <LandingPartnerStrip />
        <LandingSolution />
        <LandingFeatures />

        <AnimatedSection delayMs={40}>
          <div className="landing-section">
            <FaqSection />
          </div>
        </AnimatedSection>

        <LandingCta />

        {/* <AnimatedSection delayMs={40}>
          <Box
            style={{
              borderTop: "1px solid var(--mantine-color-default-border)",
              padding: "3rem var(--mantine-spacing-md)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "1rem",
              textAlign: "center",
              background: "var(--vibra-surface-muted)",
            }}
          >
            <Text
              style={{
                fontFamily: "var(--vibra-font-mono)",
                fontSize: "0.65rem",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                color: "var(--vibra-v)",
              }}
            >
              Para produtores
            </Text>
            <Title
              order={3}
              style={{
                fontFamily: "var(--vibra-font-display)",
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                fontWeight: 800,
                letterSpacing: "-0.03em",
                color: "var(--mantine-color-text)",
                margin: 0,
              }}
            >
              Você organiza shows? Conheça a plataforma.
            </Title>
            <Text size="sm" c="dimmed" maw={420}>
              Taxa justa, dashboard ao vivo e recebimento em D+3. Tudo que você precisa para vender mais.
            </Text>
            <Button
              component={Link}
              to="/para-produtores"
              size="md"
              radius="xl"
              leftSection={<IconCalendarPlus size={16} />}
              rightSection={<IconArrowRight size={16} />}
              style={{ marginTop: "0.5rem" }}
            >
              Ver como funciona
            </Button>
          </Box>
        </AnimatedSection> */}
      </Stack>

      <SiteFooter />
    </>
  );
}
