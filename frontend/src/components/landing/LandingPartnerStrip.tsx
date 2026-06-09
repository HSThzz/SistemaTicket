import { Box, Text } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";

const PARTNERS = [
  "Spotify",
  "Allianz Parque",
  "Time For Fun",
  "Festival Virada",
  "Red Bull",
  "Boiler Room",
  "Rock in Rio",
  "Lollapalooza",
  "Primavera Sound",
  "Circo Voador",
  "Audio Club",
  "D-Edge",
  "Sónar SP",
  "The Town",
  "Planeta Atlântida",
  "VillaMix",
  "Qualistage",
  "Espaço das Américas",
  "Memorial LATAM",
  "Kia Arena",
  "Shotgun",
  "Universal Music",
  "Sony Music",
  "Warner Music",
  "Multishow",
  "Amazon Music",
] as const;

function PartnerTrack({ id }: { id: string }) {
  return (
    <Box className="landing-partners-segment" aria-hidden={id === "b" ? true : undefined}>
      {PARTNERS.map((name) => (
        <Text key={`${id}-${name}`} className="landing-partner-logo" component="span">
          {name}
        </Text>
      ))}
    </Box>
  );
}

export function LandingPartnerStrip() {
  return (
    <AnimatedSection delayMs={30}>
      <Box className="landing-band landing-band--partners">
        <Box className="landing-partners-header">
          <Text className="landing-partners-kicker">Rede de venues e produtores</Text>
        </Box>

        <Box className="landing-partners-marquee" aria-label="Marcas parceiras">
          <Box className="landing-partners-track">
            <PartnerTrack id="a" />
            <PartnerTrack id="b" />
          </Box>
        </Box>
      </Box>
    </AnimatedSection>
  );
}
