import { Box, Text } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";

const PARTNERS = [
  "Spotify",
  "Allianz Parque",
  "Time For Fun",
  "Festival Virada",
  "Red Bull",
  "Boiler Room",
] as const;

export function LandingPartnerStrip() {
  return (
    <AnimatedSection delayMs={30}>
      <Box className="landing-band landing-band--partners">
        <Box className="landing-band-inner landing-partners-row">
          <Text className="landing-partners-kicker">Rede de venues e produtores</Text>
          <Box className="landing-partners-logos" role="list">
            {PARTNERS.map((name) => (
              <Text key={name} className="landing-partner-logo" role="listitem">
                {name}
              </Text>
            ))}
          </Box>
        </Box>
      </Box>
    </AnimatedSection>
  );
}
