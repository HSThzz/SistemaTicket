import { Paper, type PaperProps } from "@mantine/core";
import type { ReactNode } from "react";

export function PremiumPaper({
  className,
  children,
  ...props
}: PaperProps & { children?: ReactNode }) {
  return (
    <Paper radius="lg" withBorder className={`premium-panel ${className ?? ""}`.trim()} {...props}>
      {children}
    </Paper>
  );
}
