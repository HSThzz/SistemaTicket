import { Box, Text } from "@mantine/core";
import { ZeMascot } from "@/modules/leads/features/contact/components/ZeMascot";

type LandingMascotPanelProps = {
  size?: number;
  label?: string;
  animated?: boolean;
  variant?: "hero" | "stage";
  className?: string;
};

export function LandingMascotPanel({
  size = 180,
  label = "Zé · O Mascote Oficial",
  animated = true,
  variant = "stage",
  className,
}: LandingMascotPanelProps) {
  if (variant === "hero") {
    return (
      <Box className={["home-hero-mascot", className ?? ""].filter(Boolean).join(" ")}>
        <Box className="home-hero-mascot-panel">
          <ZeMascot size={size} animated={animated} variant="dark" />
          <Text className="home-hero-mascot-label">{label}</Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box className={["landing-mascot-stage", className ?? ""].filter(Boolean).join(" ")}>
      <Box className="landing-mascot-stage-glow" aria-hidden="true" />
      <ZeMascot size={size} animated={animated} variant="dark" />
      <Text className="landing-mascot-stage-label">{label}</Text>
    </Box>
  );
}
