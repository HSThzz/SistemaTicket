import { Link } from "react-router-dom";
import { Button, type ButtonProps } from "@mantine/core";
import { IconArrowLeft } from "@tabler/icons-react";

interface BackButtonProps extends Omit<ButtonProps, "component" | "leftSection"> {
  to: string;
  label: string;
}

export function BackButton({ to, label, ...props }: BackButtonProps) {
  return (
    <Button
      component={Link}
      to={to}
      variant="subtle"
      radius="xl"
      leftSection={<IconArrowLeft size={16} />}
      w="fit-content"
      {...props}
    >
      {label}
    </Button>
  );
}
