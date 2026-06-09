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
              variant="social"
              label="Ao vivo"
              cards={[
                { label: "Taxa média", value: "20%", detail: "cobrada do fã" },
                { label: "Personalização", value: "0%", detail: "zero histórico" },
              ]}
            />
          }
        />
      </Box>
    </AnimatedSection>
  );
}
