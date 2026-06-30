import { ActionIcon, Tooltip, useMantineColorScheme } from "@mantine/core";
import { IconMoon, IconSun } from "@tabler/icons-react";

export function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const isDark = colorScheme === "dark";

  return (
    <Tooltip label={isDark ? "Modo claro" : "Modo escuro"} withArrow>
      <ActionIcon
        variant="subtle"
        color="gray"
        size="lg"
        aria-label={isDark ? "Ativar modo claro" : "Ativar modo escuro"}
        onClick={() => toggleColorScheme()}
      >
        {isDark ? <IconSun size={20} stroke={1.6} /> : <IconMoon size={20} stroke={1.6} />}
      </ActionIcon>
    </Tooltip>
  );
}
