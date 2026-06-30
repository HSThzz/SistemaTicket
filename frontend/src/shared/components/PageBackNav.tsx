import { Box } from "@mantine/core";
import { BackButton } from "./BackButton";

interface PageBackNavProps {
  to: string;
  label: string;
}

/**
 * Navegação de retorno padrão — posicionada abaixo da hero, no corpo da página.
 */
export function PageBackNav({ to, label }: PageBackNavProps) {
  return (
    <Box className="page-back-nav">
      <BackButton to={to} label={label} />
    </Box>
  );
}
