import { Link } from "react-router-dom";
import { Button, type ButtonProps } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

interface BackButtonProps extends Omit<ButtonProps, "component" | "leftSection"> {
  to: string;
  label: string;
  inverted?: boolean;
}

export function BackButton({ to, label, inverted, ...props }: BackButtonProps) {
  return (
    <Button
      component={Link}
      to={to}
      variant={inverted ? "white" : "subtle"}
      color={inverted ? "dark" : undefined}
      radius="xl"
      leftSection={<IconArrowLeft size={16} />}
      w="fit-content"
      {...props}
    >
      {label}
    </Button>
  );
}
