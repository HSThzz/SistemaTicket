import { Box, Text } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";
import { LandingShowcase } from "./LandingShowcase";
import { LandingVisualPanel } from "./LandingVisualPanel";

export function LandingProblem() {
  return (
    <AnimatedSection>
      <Box className="landing-section landing-section--loose">
        <LandingShowcase
          titleClassName="landing-display-title landing-display-title--sm"
          title={
            <>
              O brasileiro ama shows.{" "}
              <Text span inherit c="brand.7">
                Odeia comprar ingresso.
              </Text>
            </>
          }
          body="Sympla e Ingresse são ferramentas — não experiências."
          visual={
            <LandingVisualPanel
              variant="photo"
              tone="crowd"
              label="Ao vivo"
              caption="10 anos de mercado. Zero amor de marca."
            />
          }
        />
      </Box>
    </AnimatedSection>
  );
}
