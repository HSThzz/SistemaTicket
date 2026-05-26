import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Button,
  Grid,
  Group,
  NumberInput,
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
  IconCheck,
  IconRocket,
  IconSettings,
  IconX,
} from "@tabler/icons-react";
import { AnimatedSection } from "../../components/home/AnimatedSection";
import { BackButton } from "../../components/account/BackButton";
import { PageHeader } from "../../components/account/PageHeader";
import { PageLoader } from "../../components/account/PageLoader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
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
    return <PageLoader label="Carregando evento..." />;
  }

  if (error || !event) {
    return (
      <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
        {error ?? "Evento não encontrado."}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      <BackButton to="/produtor/eventos" label="Voltar aos eventos" />

      <AnimatedSection>
        <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
          <PageHeader
            icon={<IconSettings size={28} color="var(--mantine-color-brand-6)" />}
            title="Gerenciar"
            highlight="evento"
            description={`${formatShortDate(event.date)} · ${event.location}`}
          />
          <Group gap="sm">
            <Badge color={getEventStatusColor(event.status)} variant="light" size="lg" radius="sm">
              {getEventStatusLabel(event.status)}
            </Badge>
            {event.status === "DRAFT" ? (
              <Button
                leftSection={<IconRocket size={18} />}
                loading={savingEvent}
                radius="xl"
                onClick={() => void handlePublish()}
              >
                Publicar evento
              </Button>
            ) : null}
          </Group>
        </Group>
      </AnimatedSection>

      <Grid>
        <Grid.Col span={{ base: 12, md: 7 }}>
          <AnimatedSection delayMs={60}>
            <PremiumPaper p="xl">
              <form onSubmit={handleSaveEvent}>
                <Stack gap="md">
                  <Title order={4}>Detalhes do evento</Title>
                  <TextInput label="Título" radius="md" {...eventForm.getInputProps("title")} />
                  <Textarea label="Descrição" minRows={4} radius="md" {...eventForm.getInputProps("description")} />
                  <TextInput label="Data e hora" type="datetime-local" radius="md" {...eventForm.getInputProps("date")} />
                  <TextInput label="Local" radius="md" {...eventForm.getInputProps("location")} />
                  <Select
                    label="Status"
                    radius="md"
                    data={[
                      { value: "DRAFT", label: "Rascunho" },
                      { value: "PUBLISHED", label: "Publicado" },
                      { value: "CANCELLED", label: "Cancelado" },
                      { value: "FINISHED", label: "Encerrado" },
                    ]}
                    {...eventForm.getInputProps("status")}
                  />
                  <Group justify="flex-end" pt="sm">
                    <Button type="submit" loading={savingEvent} variant="light" radius="xl">
                      Salvar alterações
                    </Button>
                  </Group>
                </Stack>
              </form>
            </PremiumPaper>
          </AnimatedSection>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 5 }}>
          <AnimatedSection delayMs={100}>
            <PremiumPaper p="xl">
              <form onSubmit={handleCreateLot}>
                <Stack gap="md">
                  <Title order={4}>Novo lote</Title>
                  <TextInput label="Nome do lote" placeholder="Pista, VIP..." radius="md" {...lotForm.getInputProps("name")} />
                  <NumberInput
                    label="Preço (R$)"
                    decimalScale={2}
                    fixedDecimalScale
                    min={0.01}
                    radius="md"
                    {...lotForm.getInputProps("priceReais")}
                  />
                  <NumberInput label="Quantidade total" min={1} radius="md" {...lotForm.getInputProps("totalQuantity")} />
                  <Button type="submit" loading={creatingLot} radius="xl">
                    Adicionar lote
                  </Button>
                </Stack>
              </form>
            </PremiumPaper>
          </AnimatedSection>
        </Grid.Col>
      </Grid>

      <AnimatedSection delayMs={140}>
        <PremiumPaper p="xl" className="data-table-panel">
          <Stack gap="lg">
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
              <Button component={Link} to={`/eventos/${event.id}`} variant="light" radius="xl" w="fit-content">
                Ver na vitrine pública
              </Button>
            ) : null}
          </Stack>
        </PremiumPaper>
      </AnimatedSection>
    </Stack>
  );
}
