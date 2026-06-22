import {
  Badge,
  Button,
  Drawer,
  Group,
  Menu,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconAdjustmentsHorizontal,
  IconArrowsSort,
  IconCalendar,
  IconCurrencyReal,
  IconMapPin,
  IconTicket,
  IconX,
  IconLock,
} from "@tabler/icons-react";
import { EventsCategoryGrid } from "./EventsCategoryGrid";
import type { EventsDateFilter, EventsPriceFilter } from "./EventsFilterBar";
import type { EventCategory, EventsSort } from "../../utils/eventVisuals";
import { SORT_LABELS } from "../../utils/eventVisuals";
import {
  EVENT_TYPE_FILTER_LABELS,
  type EventTypeFilter,
} from "../../utils/eventTypeFilter";

interface EventsFiltersDrawerProps {
  cities: string[];
  city: string | "all";
  onCityChange: (city: string | "all") => void;
  dateFilter: EventsDateFilter;
  onDateFilterChange: (value: EventsDateFilter) => void;
  priceFilter: EventsPriceFilter;
  onPriceFilterChange: (value: EventsPriceFilter) => void;
  sort: EventsSort;
  onSortChange: (value: EventsSort) => void;
  hideSoldOut: boolean;
  onHideSoldOutChange: (value: boolean) => void;
  typeFilter: EventTypeFilter;
  onTypeFilterChange: (value: EventTypeFilter) => void;
  category: EventCategory;
  onCategoryChange: (value: EventCategory) => void;
  activeFiltersCount: number;
  onClearFilters: () => void;
}

function DrawerOption({
  label,
  active,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <UnstyledButton
      className={`events-drawer-option${active ? " events-drawer-option--active" : ""}`}
      onClick={onClick}
    >
      {label}
    </UnstyledButton>
  );
}

export function EventsFiltersDrawer({
  cities,
  city,
  onCityChange,
  dateFilter,
  onDateFilterChange,
  priceFilter,
  onPriceFilterChange,
  sort,
  onSortChange,
  hideSoldOut,
  onHideSoldOutChange,
  typeFilter,
  onTypeFilterChange,
  category,
  onCategoryChange,
  activeFiltersCount,
  onClearFilters,
}: EventsFiltersDrawerProps) {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <Group gap="sm" wrap="nowrap" className="events-mobile-toolbar">
        <Button
          variant="default"
          radius="xl"
          leftSection={<IconAdjustmentsHorizontal size={16} />}
          onClick={open}
          className="events-mobile-filters-btn"
          rightSection={
            activeFiltersCount > 0 ? (
              <Badge size="sm" circle color="brand">
                {activeFiltersCount}
              </Badge>
            ) : undefined
          }
        >
          Filtros
        </Button>

        <Menu withinPortal position="bottom-end" shadow="md">
          <Menu.Target>
            <Button
              variant="light"
              color="gray"
              radius="xl"
              leftSection={<IconArrowsSort size={16} />}
              className="events-mobile-sort-btn"
            >
              {sort === "date" ? "Ordenar" : SORT_LABELS[sort]}
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Item onClick={() => onSortChange("date")}>Data</Menu.Item>
            <Menu.Item onClick={() => onSortChange("price_asc")}>Menor preço</Menu.Item>
            <Menu.Item onClick={() => onSortChange("price_desc")}>Maior preço</Menu.Item>
          </Menu.Dropdown>
        </Menu>
      </Group>

      <Drawer
        opened={opened}
        onClose={close}
        position="bottom"
        size="85%"
        title="Filtrar eventos"
        classNames={{ content: "events-filters-drawer" }}
        scrollAreaComponent={ScrollArea.Autosize}
      >
        <Stack gap="lg" pb="md">
          <Stack gap="xs">
            <Group gap={6}>
              <IconMapPin size={16} />
              <Text fw={700} size="sm">
                Cidade
              </Text>
            </Group>
            <Group gap="xs">
              <DrawerOption
                label="Todas"
                active={city === "all"}
                onClick={() => onCityChange("all")}
              />
              {cities.map((item) => (
                <DrawerOption
                  key={item}
                  label={item}
                  active={city === item}
                  onClick={() => onCityChange(item)}
                />
              ))}
            </Group>
          </Stack>

          <Stack gap="xs">
            <Group gap={6}>
              <IconCalendar size={16} />
              <Text fw={700} size="sm">
                Data
              </Text>
            </Group>
            <Group gap="xs">
              <DrawerOption
                label="Qualquer data"
                active={dateFilter === "all"}
                onClick={() => onDateFilterChange("all")}
              />
              <DrawerOption
                label="Esta semana"
                active={dateFilter === "soon"}
                onClick={() => onDateFilterChange("soon")}
              />
            </Group>
          </Stack>

          <Stack gap="xs">
            <Group gap={6}>
              <IconCurrencyReal size={16} />
              <Text fw={700} size="sm">
                Preço
              </Text>
            </Group>
            <Group gap="xs">
              <DrawerOption
                label="Qualquer"
                active={priceFilter === "all"}
                onClick={() => onPriceFilterChange("all")}
              />
              <DrawerOption
                label="Gratuito"
                active={priceFilter === "free"}
                onClick={() => onPriceFilterChange("free")}
              />
              <DrawerOption
                label="Pago"
                active={priceFilter === "paid"}
                onClick={() => onPriceFilterChange("paid")}
              />
            </Group>
          </Stack>

          <Stack gap="xs">
            <Group gap={6}>
              <IconLock size={16} />
              <Text fw={700} size="sm">
                Acesso
              </Text>
            </Group>
            <Group gap="xs">
              {(["all", "public", "private"] as const).map((value) => (
                <DrawerOption
                  key={value}
                  label={EVENT_TYPE_FILTER_LABELS[value]}
                  active={typeFilter === value}
                  onClick={() => onTypeFilterChange(value)}
                />
              ))}
            </Group>
          </Stack>

          <Stack gap="xs">
            <Group gap={6}>
              <IconArrowsSort size={16} />
              <Text fw={700} size="sm">
                Ordenar
              </Text>
            </Group>
            <Group gap="xs">
              {(["date", "price_asc", "price_desc"] as EventsSort[]).map((value) => (
                <DrawerOption
                  key={value}
                  label={SORT_LABELS[value]}
                  active={sort === value}
                  onClick={() => onSortChange(value)}
                />
              ))}
            </Group>
          </Stack>

          <Button
            variant={hideSoldOut ? "filled" : "light"}
            color={hideSoldOut ? "brand" : "gray"}
            radius="xl"
            leftSection={<IconTicket size={16} />}
            onClick={() => onHideSoldOutChange(!hideSoldOut)}
          >
            Só eventos com ingressos
          </Button>

          <Stack gap="xs">
            <Text fw={700} size="sm">
              Categoria
            </Text>
            <EventsCategoryGrid value={category} onChange={onCategoryChange} variant="drawer" />
          </Stack>

          {activeFiltersCount > 0 ? (
            <Button
              variant="subtle"
              color="gray"
              leftSection={<IconX size={14} />}
              onClick={() => {
                onClearFilters();
                close();
              }}
            >
              Limpar filtros
            </Button>
          ) : null}

          <Button radius="xl" onClick={close}>
            Ver resultados
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}
