import { Group, Text } from "@mantine/core";
import { ZeMascot } from "@/modules/leads/features/contact/components/ZeMascot";

interface VibraLogoProps {
  showMascot?: boolean;
  showWordmark?: boolean;
  mascotSize?: number;
  wordmarkSize?: "sm" | "md" | "lg";
}

const WORDMARK_SIZES = {
  sm: "md",
  md: "lg",
  lg: "xl",
} as const;

export function VibraLogo({
  showMascot = true,
  showWordmark = true,
  mascotSize = 32,
  wordmarkSize = "md",
}: VibraLogoProps) {
  return (
    <Group gap="xs" wrap="nowrap">
      {showMascot ? <ZeMascot size={mascotSize} animated={false} variant="dark" /> : null}
      {showWordmark ? (
        <Text
          fw={900}
          size={WORDMARK_SIZES[wordmarkSize]}
          className="vibra-wordmark"
          style={{ letterSpacing: "-0.04em", lineHeight: 1 }}
        >
          VIBRA
        </Text>
      ) : null}
    </Group>
  );
}
