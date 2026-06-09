import { Box } from "@mantine/core";
import type { ReactNode } from "react";

type LandingDeviceStageProps = {
  children: ReactNode;
};

export function LandingDeviceStage({ children }: LandingDeviceStageProps) {
  return <Box className="landing-device-stage">{children}</Box>;
}
