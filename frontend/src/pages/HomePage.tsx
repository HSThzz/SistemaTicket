/**
 * @file Página de apresentação da VIBRA (landing institucional).
 * @module pages/HomePage
 */

import { Stack } from "@mantine/core";
import { FaqSection } from "../components/home/FaqSection";
import { SiteFooter } from "../components/home/SiteFooter";
import { LandingCta } from "../components/landing/LandingCta";
import { LandingEaseBand } from "../components/landing/LandingEaseBand";
import { LandingFeatures } from "../components/landing/LandingFeatures";
import { LandingHero } from "../components/landing/LandingHero";
import { LandingPartnerStrip } from "../components/landing/LandingPartnerStrip";
import { LandingProblem } from "../components/landing/LandingProblem";
import { LandingSolution } from "../components/landing/LandingSolution";
import { AnimatedSection } from "../components/home/AnimatedSection";

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
      </Stack>

      <SiteFooter />
    </>
  );
}
