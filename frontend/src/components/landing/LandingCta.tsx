import { Link } from "react-router-dom";
import { Box, Button, Text } from "@mantine/core";
import { IconArrowRight } from "@tabler/icons-react";
import { AnimatedSection } from "../home/AnimatedSection";
import { LandingShowcase } from "./LandingShowcase";
import { PhoneMockup } from "./PhoneMockup";

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
              O Zé tá pronto.{" "}
              <Text span inherit c="brand.7">
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
              Baixar / explorar
            </Button>
          }
          visual={
            <Box className="landing-device-stage">
              <PhoneMockup screen="checkout" />
            </Box>
          }
        />
      </Box>
    </AnimatedSection>
  );
}
