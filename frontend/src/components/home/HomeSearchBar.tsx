import { Group, TextInput } from "@mantine/core";
import { IconMapPin, IconSearch } from "@tabler/icons-react";

interface HomeSearchBarProps {
  query: string;
  location: string;
  onQueryChange: (value: string) => void;
  onLocationChange: (value: string) => void;
}

export function HomeSearchBar({
  query,
  location,
  onQueryChange,
  onLocationChange,
}: HomeSearchBarProps) {
  return (
    <Group
      gap="sm"
      wrap="nowrap"
      className="search-bar-glow"
      style={{
        padding: 6,
        borderRadius: "var(--mantine-radius-xl)",
        border: "1px solid light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.1))",
        background: "light-dark(white, var(--mantine-color-dark-6))",
        boxShadow: "0 8px 32px light-dark(rgba(74,111,232,0.08), rgba(0,0,0,0.25))",
      }}
    >
      <TextInput
        flex={1}
        variant="unstyled"
        placeholder="Buscar experiências, artistas, locais..."
        value={query}
        onChange={(event) => onQueryChange(event.currentTarget.value)}
        leftSection={<IconSearch size={20} stroke={1.6} color="var(--mantine-color-brand-6)" />}
        styles={{
          input: {
            fontSize: "var(--mantine-font-size-md)",
            paddingLeft: 40,
          },
        }}
      />
      <TextInput
        w={{ base: 140, sm: 200 }}
        variant="unstyled"
        placeholder="Qualquer lugar"
        value={location}
        onChange={(event) => onLocationChange(event.currentTarget.value)}
        leftSection={<IconMapPin size={18} stroke={1.6} color="var(--mantine-color-dimmed)" />}
        styles={{
          input: {
            fontSize: "var(--mantine-font-size-sm)",
            borderLeft: "1px solid light-dark(rgba(0,0,0,0.08), rgba(255,255,255,0.08))",
            paddingLeft: 36,
          },
        }}
      />
    </Group>
  );
}
