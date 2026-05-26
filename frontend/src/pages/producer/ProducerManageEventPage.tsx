import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Center,
  Grid,
  Group,
  Loader,
  NumberInput,
  Paper,
  Select,
  Stack,
  Table,
  Text,
  Textarea,
  TextInput,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconArrowLeft,
  IconCheck,
  IconRocket,
  IconX,
} from "@tabler/icons-react";
import * as eventService from "../../services/eventService";
import type { Event, EventStatus } from "../../types/api";
import { formatCurrencyFromCents, formatShortDate } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getEventStatusColor, getEventStatusLabel } from "../../utils/statusLabels";

interface EventFormValues {
  title: string;
  description: string;
  date: string;
  location: string;
  status: string;
}

interface LotFormValues {
  name: string;
  priceReais: number | string;
  totalQuantity: number | string;
}

function toLocalDatetimeInput(isoDate: string): string {
  const date = new Date(isoDate);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

function toIsoDate(localDateTime: string): string {
  return new Date(localDateTime).toISOString();
}

function parsePriceToCents(value: number | string): number {
  const numeric = typeof value === "string" ? Number(value.replace(",", ".")) : value;
  return Math.round(numeric * 100);
}

export function ProducerManageEventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingEvent, setSavingEvent] = useState(false);
  const [creatingLot, setCreatingLot] = useState(false);

  const eventForm = useForm<EventFormValues>({
    initialValues: {
      title: "",
      description: "",
      date: "",
      location: "",
      status: "DRAFT",
    },
  });

  const lotForm = useForm<LotFormValues>({
    initialValues: {
      name: "",
      priceReais: 50,
      totalQuantity: 100,
    },
    validate: {
      name: (value) => (String(value).trim().length >= 2 ? null : "Informe o nome do lote"),
      priceReais: (value) => (Number(value) > 0 ? null : "Preço inválido"),
      totalQuantity: (value) => (Number(value) > 0 ? null : "Quantidade inválida"),
    },
  });

  useEffect(() => {
    if (!eventId) {
      setError("Evento inválido.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    eventService
      .getManagedEvent(eventId)
      .then((data) => {
        if (cancelled) {
          return;
        }

        if (!data) {
          setError("Evento não encontrado ou sem permissão.");
          return;
        }

        setEvent(data);
        eventForm.setValues({
          title: data.title,
          description: data.description,
          date: toLocalDatetimeInput(data.date),
          location: data.location,
          status: data.status,
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setError(getApiErrorMessage(err, "Falha ao carregar evento."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
    // eventForm is stable from useForm; eventId drives reload
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId]);

  const reloadEvent = async () => {
    if (!eventId) {
      return;
    }

    const data = await eventService.getManagedEvent(eventId);
    if (data) {
      setEvent(data);
    }
  };

  const handleSaveEvent = eventForm.onSubmit(async (values) => {
    if (!eventId) {
      return;
    }

    setSavingEvent(true);

    try {
      const updated = await eventService.updateEvent(eventId, {
        title: values.title.trim(),
        description: values.description.trim(),
        date: toIsoDate(values.date),
        location: values.location.trim(),
        status: values.status as EventStatus,
      });

      setEvent(updated);
      notifications.show({
        title: "Evento atualizado",
        message: "Alterações salvas com sucesso.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Erro ao salvar",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSavingEvent(false);
    }
  });

  const handlePublish = async () => {
    if (!eventId) {
      return;
    }

    setSavingEvent(true);

    try {
      const updated = await eventService.updateEvent(eventId, { status: "PUBLISHED" });
      setEvent(updated);
      eventForm.setFieldValue("status", "PUBLISHED");

      notifications.show({
        title: "Evento publicado",
        message: "Agora aparece na vitrine para compradores.",
        color: "green",
        icon: <IconRocket size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Erro ao publicar",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSavingEvent(false);
    }
  };

  const handleCreateLot = lotForm.onSubmit(async (values) => {
    if (!eventId) {
      return;
    }

    setCreatingLot(true);

    try {
      await eventService.createTicketLot(eventId, {
        name: String(values.name).trim(),
        price: parsePriceToCents(values.priceReais),
        totalQuantity: Number(values.totalQuantity),
      });

      lotForm.reset();
      await reloadEvent();

      notifications.show({
        title: "Lote criado",
        message: "Lote de ingressos adicionado ao evento.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Erro ao criar lote",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setCreatingLot(false);
    }
  });

  if (loading) {
    return (
      <Center py="xl">
        <Loader color="brand" size="lg" />
      </Center>
    );
  }

  if (error || !event) {
    return (
      <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro">
        {error ?? "Evento não encontrado."}
      </Alert>
    );
  }

  return (
    <Stack gap="xl">
      <Button
        component={Link}
        to="/produtor"
        variant="subtle"
        leftSection={<IconArrowLeft size={16} />}
        w="fit-content"
      >
        Voltar ao painel
      </Button>

      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Group gap="sm">
            <Title order={2}>{event.title}</Title>
            <Badge color={getEventStatusColor(event.status)} variant="light">
              {getEventStatusLabel(event.status)}
            </Badge>
          </Group>
          <Text c="dimmed">{formatShortDate(event.date)} · {event.location}</Text>
        </Stack>

        {event.status === "DRAFT" ? (
          <Button
            leftSection={<IconRocket size={18} />}
            loading={savingEvent}
            onClick={() => void handlePublish()}
          >
            Publicar evento
          </Button>
        ) : null}
      </Group>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <Paper p="xl" radius="md" withBorder>
            <form onSubmit={handleSaveEvent}>
              <Stack gap="md">
                <Title order={4}>Detalhes do evento</Title>
                <TextInput label="Título" {...eventForm.getInputProps("title")} />
                <Textarea label="Descrição" minRows={4} {...eventForm.getInputProps("description")} />
                <TextInput label="Data e hora" type="datetime-local" {...eventForm.getInputProps("date")} />
                <TextInput label="Local" {...eventForm.getInputProps("location")} />
                <Select
                  label="Status"
                  data={[
                    { value: "DRAFT", label: "Rascunho" },
                    { value: "PUBLISHED", label: "Publicado" },
                    { value: "CANCELLED", label: "Cancelado" },
                    { value: "FINISHED", label: "Encerrado" },
                  ]}
                  {...eventForm.getInputProps("status")}
                />
                <Group justify="flex-end">
                  <Button type="submit" loading={savingEvent} variant="light">
                    Salvar alterações
                  </Button>
                </Group>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <Paper p="xl" radius="md" withBorder>
            <form onSubmit={handleCreateLot}>
              <Stack gap="md">
                <Title order={4}>Novo lote</Title>
                <TextInput label="Nome do lote" placeholder="Pista, VIP..." {...lotForm.getInputProps("name")} />
                <NumberInput
                  label="Preço (R$)"
                  decimalScale={2}
                  fixedDecimalScale
                  min={0.01}
                  {...lotForm.getInputProps("priceReais")}
                />
                <NumberInput
                  label="Quantidade total"
                  min={1}
                  {...lotForm.getInputProps("totalQuantity")}
                />
                <Button type="submit" loading={creatingLot}>
                  Adicionar lote
                </Button>
              </Stack>
            </form>
          </Paper>
        </Grid.Col>
      </Grid>

      <Paper p="xl" radius="md" withBorder>
        <Stack gap="md">
          <Title order={4}>Lotes cadastrados</Title>

          {event.ticketLots.length === 0 ? (
            <Text c="dimmed">Nenhum lote cadastrado ainda.</Text>
          ) : (
            <Table highlightOnHover withTableBorder>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Nome</Table.Th>
                  <Table.Th>Preço</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Disponível</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {event.ticketLots.map((lot) => (
                  <Table.Tr key={lot.id}>
                    <Table.Td>{lot.name}</Table.Td>
                    <Table.Td>{formatCurrencyFromCents(lot.price)}</Table.Td>
                    <Table.Td>{lot.totalQuantity}</Table.Td>
                    <Table.Td>{lot.availableQuantity}</Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {event.status === "PUBLISHED" ? (
            <Button component={Link} to={`/eventos/${event.id}`} variant="light">
              Ver na vitrine pública
            </Button>
          ) : null}
        </Stack>
      </Paper>
    </Stack>
  );
}
