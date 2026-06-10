import { Box } from "@mantine/core";
import { IconCoin, IconSparkles, IconUsers } from "@tabler/icons-react";
import { AnimatedSection } from "../home/AnimatedSection";
import { LandingDeviceStage } from "./LandingDeviceStage";
import { LandingFeatureList } from "./LandingFeatureList";
import { LandingShowcase } from "./LandingShowcase";
import { PhoneMockup } from "./PhoneMockup";
import { StaggerTestimonials } from "./StaggerTestimonials";

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
        <StaggerTestimonials />
      </AnimatedSection>

    </>
  );
}
