import { Box, Button } from "@mantine/core";
import { Link } from "react-router-dom";
import { IconArrowRight } from "@tabler/icons-react";
import { AnimatedSection } from "../home/AnimatedSection";
import { LandingShowcase } from "./LandingShowcase";
import { PhoneMockup } from "./PhoneMockup";

export function LandingSolution() {
  return (
    <AnimatedSection delayMs={60}>
      <Box className="landing-section landing-section--loose">
        <LandingShowcase
          flip
          visualBleed
          titleClassName="landing-display-title landing-display-title--sm"
          title="Favoritos conhecidos, paixões novas."
          body="Conecta com Spotify e encontra shows dos artistas que você já ama — antes de todo mundo."
          footer={
            <Button
              component={Link}
              to="/eventos"
              size="md"
              radius="xl"
              className="landing-pill-cta"
              rightSection={<IconArrowRight size={16} />}
            >
              Explorar artistas
            </Button>
          }
          visual={
            <Box className="landing-device-stage">
              <PhoneMockup screen="spotify" />
            </Box>
          }
        />
      </Box>
    </AnimatedSection>
  );
}
