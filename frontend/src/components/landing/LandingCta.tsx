import { Link } from "react-router-dom";
import { Box, Button, Text } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { AnimatedSection } from "../home/AnimatedSection";
import { LandingMascotPanel } from "./LandingMascotPanel";
import { LandingShowcase } from "./LandingShowcase";

export function LandingCta() {
  return (
    <AnimatedSection delayMs={60}>
      <Box className="landing-section landing-final-cta landing-section--loose">
        <LandingShowcase
          flip
          visualBleed
          titleClassName="landing-display-title landing-display-title--sm"
          title={
            <>
              <span style={{ display: "block", whiteSpace: "nowrap" }}>O Zé tá pronto.</span>
              <Text span inherit c="brand.7" style={{ display: "block" }}>
                E você?
              </Text>
            </>
          }
          body="Descubra shows, compre com PIX e receba seu ingresso na hora."
          footer={
            <Button
              component={Link}
              to="/eventos"
              size="lg"
              radius="xl"
              className="landing-pill-cta"
              rightSection={<IconArrowRight size={18} />}
            >
              Explorar eventos
            </Button>
          }
          visual={
            <LandingMascotPanel
              variant="hero"
              size={180}
              animated
              label="Zé · pronto para o show"
            />
          }
        />
      </Box>
    </AnimatedSection>
  );
}
