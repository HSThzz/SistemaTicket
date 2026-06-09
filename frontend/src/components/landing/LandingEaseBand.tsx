import { Box, Text } from "@mantine/core";
import { AnimatedSection } from "../home/AnimatedSection";

const EASE_ITEMS = [
  {
    glyph: "⚡",
    line: "Ingresso em menos tempo do que leu isso",
  },
  {
    glyph: "💸",
    line: "Preço final na tela — zero surpresa no PIX",
  },
  {
    glyph: "✨",
    line: "Recomendações no feed, feitas pro seu gosto",
  },
] as const;

export function LandingEaseBand() {
  return (
    <AnimatedSection>
      <Box className="landing-band landing-band--ease">
        <Box className="landing-band-inner">
          <Text className="landing-band-title">Ingresso surpreendentemente fácil</Text>
          <Box className="landing-ease-grid">
            {EASE_ITEMS.map((item, index) => (
              <Box
                key={item.line}
                className={`landing-ease-item landing-ease-item--${index + 1}`}
              >
                <Text className="landing-ease-glyph" aria-hidden="true">
                  {item.glyph}
                </Text>
                <Text className="landing-ease-line">{item.line}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </AnimatedSection>
  );
}
