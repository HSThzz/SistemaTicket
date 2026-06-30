import { TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

interface EventsSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function EventsSearchBar({ value, onChange }: EventsSearchBarProps) {
  return (
    <TextInput
      className="events-search-input"
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      placeholder="Procurar por evento, local ou cidade"
      leftSection={<IconSearch size={18} stroke={1.6} />}
      radius="xl"
      size="md"
    />
  );
}
