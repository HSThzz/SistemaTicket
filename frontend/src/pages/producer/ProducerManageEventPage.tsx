/**
 * @file Edição de evento, publicação e criação de lotes pelo produtor.
 * @module pages/producer/ProducerManageEventPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Badge,
  Box,
  Button,
  Container,
  Grid,
  Group,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Textarea,
  TextInput,
  ThemeIcon,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCalendar,
  IconCheck,
  IconExternalLink,
  IconMapPin,
  IconPhoto,
  IconPlus,
  IconRocket,
  IconSettings,
  IconTicket,
  IconX,
} from "@tabler/icons-react";
import { BackButton } from "../../components/account/BackButton";
import { EmptyState } from "../../components/account/EmptyState";
import { PageLoader } from "../../components/account/PageLoader";
import { PremiumPaper } from "../../components/account/PremiumPaper";
import { StatCard } from "../../components/account/StatCard";
import { ProducerLotCard } from "../../components/producer/ProducerLotCard";
import * as eventService from "../../features/catalog/api/eventService";
import type { Event, EventStatus } from "../../types/api";
import { getEventCoverStyle } from "../../utils/eventVisuals";
import { formatEventDate } from "../../utils/format";
import { getApiErrorMessage } from "../../utils/errors";
import { getEventStatusColor, getEventStatusLabel } from "../../utils/statusLabels";

interface EventFormValues {
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
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

/**
 * Gerencia um evento: formulário de edição, status e cadastro de lotes de ingressos.
 */
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
      imageUrl: "",
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
          imageUrl: data.imageUrl ?? "",
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

  const lotSummary = useMemo(() => {
    if (!event) {
      return { lots: 0, capacity: 0, sold: 0, available: 0 };
    }

    const capacity = event.ticketLots.reduce((sum, lot) => sum + lot.totalQuantity, 0);
    const available = event.ticketLots.reduce((sum, lot) => sum + lot.availableQuantity, 0);

    return {
      lots: event.ticketLots.length,
      capacity,
      sold: capacity - available,
      available,
    };
  }, [event]);

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
        imageUrl: values.imageUrl.trim() || null,
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
      <Stack gap="md">
        <BackButton to="/produtor/eventos" label="Voltar aos eventos" />
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error ?? "Evento não encontrado."}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap={0}>
      <Box className="producer-manage-hero full-bleed" style={getEventCoverStyle(event)}>
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="producer-manage-hero-content">
          <Stack gap="md">
            <BackButton
              to="/produtor/eventos"
              label="Voltar aos eventos"
              inverted
              style={{ alignSelf: "flex-start" }}
            />
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
              <Stack gap="sm" maw={640}>
                <Group gap="sm" wrap="wrap">
                  <Badge color={getEventStatusColor(event.status)} variant="filled" radius="sm">
                    {getEventStatusLabel(event.status)}
                  </Badge>
                  <Badge color="white" c="dark" variant="filled" radius="sm">
                    {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
                  </Badge>
                </Group>
                <Title
                  order={1}
                  style={{
                    fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
                    lineHeight: 1.15,
                    letterSpacing: "-0.02em",
                  }}
                >
                  {event.title}
                </Title>
                <Group gap="lg" wrap="wrap" c="white" opacity={0.92}>
                  <Group gap={6}>
                    <IconCalendar size={18} />
                    <Text size="sm" fw={500}>
                      {formatEventDate(event.date)}
                    </Text>
                  </Group>
                  <Group gap={6} maw={400}>
                    <IconMapPin size={18} style={{ flexShrink: 0 }} />
                    <Text size="sm" fw={500} lineClamp={1}>
                      {event.location}
                    </Text>
                  </Group>
                </Group>
              </Stack>
              <Group gap="sm" wrap="wrap">
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
                {event.status === "PUBLISHED" ? (
                  <Button
                    component={Link}
                    to={`/eventos/${event.id}`}
                    variant="white"
                    color="dark"
                    radius="xl"
                    leftSection={<IconExternalLink size={18} />}
                  >
                    Ver na vitrine
                  </Button>
                ) : null}
              </Group>
            </Group>
          </Stack>
        </Container>
      </Box>

      <Container size="lg" py="xl" px="md">
        <Stack gap="xl">
          <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
              <StatCard label="Lotes" value={String(lotSummary.lots)} icon={<IconTicket size={20} />} />
              <StatCard
                label="Capacidade"
                value={String(lotSummary.capacity)}
                icon={<IconTicket size={20} />}
                iconColor="grape"
                valueColor="grape"
              />
              <StatCard
                label="Vendidos"
                value={String(lotSummary.sold)}
                icon={<IconTicket size={20} />}
                iconColor="teal"
                valueColor="teal"
              />
              <StatCard
                label="Disponíveis"
                value={String(lotSummary.available)}
                icon={<IconTicket size={20} />}
                iconColor="blue"
                valueColor="blue"
              />
            </SimpleGrid>

          <Grid>
            <Grid.Col span={{ base: 12, md: 7 }}>
              <PremiumPaper p="xl">
                  <form onSubmit={handleSaveEvent}>
                    <Stack gap="lg">
                      <Group gap="sm" className="producer-form-section-title">
                        <ThemeIcon size={36} radius="md" variant="light" color="brand">
                          <IconSettings size={18} />
                        </ThemeIcon>
                        <Title order={3} size="h4" className="producer-section-title">
                          Detalhes do evento
                        </Title>
                      </Group>
                      <TextInput label="Título" radius="md" {...eventForm.getInputProps("title")} />
                      <Textarea
                        label="Descrição"
                        minRows={4}
                        radius="md"
                        {...eventForm.getInputProps("description")}
                      />
                      <TextInput
                        label="Data e hora"
                        type="datetime-local"
                        radius="md"
                        {...eventForm.getInputProps("date")}
                      />
                      <TextInput label="Local" radius="md" {...eventForm.getInputProps("location")} />
                      <TextInput
                        label="URL da imagem de capa"
                        placeholder="https://images.unsplash.com/..."
                        radius="md"
                        leftSection={<IconPhoto size={16} />}
                        description="Opcional. Imagem exibida nos cards e na página do evento."
                        {...eventForm.getInputProps("imageUrl")}
                      />
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
                      <Group justify="flex-end" pt="xs">
                        <Button type="submit" loading={savingEvent} radius="xl">
                          Salvar alterações
                        </Button>
                      </Group>
                    </Stack>
                  </form>
                </PremiumPaper>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 5 }}>
              <PremiumPaper p="xl">
                  <form onSubmit={handleCreateLot}>
                    <Stack gap="lg">
                      <Group gap="sm" className="producer-form-section-title">
                        <ThemeIcon size={36} radius="md" variant="light" color="teal">
                          <IconPlus size={18} />
                        </ThemeIcon>
                        <Title order={3} size="h4" className="producer-section-title">
                          Novo lote
                        </Title>
                      </Group>
                      <TextInput
                        label="Nome do lote"
                        placeholder="Pista, VIP..."
                        radius="md"
                        {...lotForm.getInputProps("name")}
                      />
                      <NumberInput
                        label="Preço (R$)"
                        decimalScale={2}
                        fixedDecimalScale
                        min={0.01}
                        radius="md"
                        {...lotForm.getInputProps("priceReais")}
                      />
                      <NumberInput
                        label="Quantidade total"
                        min={1}
                        radius="md"
                        {...lotForm.getInputProps("totalQuantity")}
                      />
                      <Button
                        type="submit"
                        loading={creatingLot}
                        radius="xl"
                        fullWidth
                        leftSection={<IconPlus size={18} />}
                      >
                        Adicionar lote
                      </Button>
                    </Stack>
                  </form>
                </PremiumPaper>
            </Grid.Col>
          </Grid>

          <Stack gap="md">
              <Group justify="space-between" align="center" wrap="wrap" gap="sm">
                <Stack gap={4}>
                  <Title order={3} size="h4" className="producer-section-title">
                    Lotes cadastrados
                  </Title>
                  <Text c="dimmed" size="sm">
                    Acompanhe preço, estoque e ocupação de cada lote.
                  </Text>
                </Stack>
                {event.ticketLots.length > 0 ? (
                  <Badge size="lg" variant="light" color="brand" radius="sm">
                    {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
                  </Badge>
                ) : null}
              </Group>

              {event.ticketLots.length === 0 ? (
                <PremiumPaper p="xl">
                  <EmptyState
                    icon={<IconTicket size={32} />}
                    title="Nenhum lote cadastrado"
                    description="Adicione pelo menos um lote para começar a vender ingressos deste evento."
                  />
                </PremiumPaper>
              ) : (
                <Stack gap="md">
                  {event.ticketLots.map((lot) => (
                    <ProducerLotCard key={lot.id} lot={lot} />
                  ))}
                </Stack>
              )}
            </Stack>
        </Stack>
      </Container>
    </Stack>
  );
}
