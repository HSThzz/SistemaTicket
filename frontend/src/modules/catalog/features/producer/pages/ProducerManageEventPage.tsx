/**
 * @file Edição de evento, publicação e criação de lotes pelo produtor.
 * @module pages/producer/ProducerManageEventPage
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Container,
  Grid,
  Group,
  Modal,
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
  IconBulb,
  IconCalendar,
  IconCheck,
  IconExternalLink,
  IconLock,
  IconMapPin,
  IconPhoto,
  IconPlus,
  IconRocket,
  IconSettings,
  IconTicket,
  IconTrash,
  IconX,
} from "@tabler/icons-react";
import { PageBackNav } from "@/shared/components/PageBackNav";
import { EmptyState } from "@/shared/components/EmptyState";
import { PageLoader } from "@/shared/components/PageLoader";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import { StatCard } from "@/shared/components/StatCard";
import { ProducerLotCard } from "@/modules/catalog/features/producer/components/ProducerLotCard";
import { ProducerCheckInStaffPanel } from "@/modules/catalog/features/producer/components/ProducerCheckInStaffPanel";
import { ProducerParticipationPanel } from "@/modules/participation/features/requests/components/ProducerParticipationPanel";
import { EventDateTimeField } from "@/modules/catalog/features/producer/components/EventDateTimeField";
import { EventPrivateBadge } from "@/modules/catalog/features/browse/components/EventPrivateBadge";
import { EventStatusBadge } from "@/components/ui/EventStatusBadge";
import { PremiumBadge } from "@/components/ui/PremiumBadge";
import * as eventService from "@/modules/catalog/api/eventService";
import type { Event, EventStatus, TicketLot } from "@/shared/types/api";
import { eventDateToIso, isoToEventDate, validateEventDate } from "@/modules/catalog/features/producer/utils/eventDateTime";
import { getEventCoverStyle } from "@/modules/catalog/utils/eventVisuals";
import { formatEventDate } from "@/shared/utils/format";
import { getApiErrorMessage } from "@/shared/utils/errors";
import {
  getAllowedEventStatusOptions,
  getEventStatusConfirmationCopy,
  getEventStatusTransitionHint,
  isTerminalEventStatus,
  requiresEventStatusConfirmation,
} from "@/modules/catalog/features/producer/utils/eventStatus";

interface EventFormValues {
  title: string;
  description: string;
  date: Date | null;
  location: string;
  imageUrl: string;
  status: string;
  type: string;
}

const EVENT_TYPE_OPTIONS = [
  { value: "PUBLIC", label: "Público — venda direta de ingressos" },
  { value: "PRIVATE", label: "Privado — participação sob aprovação" },
] as const;

const LOT_FORM_TIPS = [
  "Use preço 0 para ingresso gratuito.",
  "Crie um lote por público (ex.: Masculino e Feminino).",
  "Evento publicado precisa ter pelo menos 1 lote.",
] as const;

interface LotFormValues {
  name: string;
  priceReais: number | string;
  totalQuantity: number | string;
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
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null);
  const [lotToDelete, setLotToDelete] = useState<TicketLot | null>(null);
  const [deletingLot, setDeletingLot] = useState(false);
  const [lotToEdit, setLotToEdit] = useState<TicketLot | null>(null);
  const [savingLotEdit, setSavingLotEdit] = useState(false);

  const eventForm = useForm<EventFormValues>({
    initialValues: {
      title: "",
      description: "",
      date: null,
      location: "",
      imageUrl: "",
      status: "DRAFT",
      type: "PUBLIC",
    },
    validate: {
      date: (value) => validateEventDate(value, { allowPast: true }),
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
      priceReais: (value) =>
        Number(value) >= 0 && !Number.isNaN(Number(value))
          ? null
          : "Preço inválido",
      totalQuantity: (value) => (Number(value) > 0 ? null : "Quantidade inválida"),
    },
  });

  const editLotForm = useForm<LotFormValues>({
    initialValues: {
      name: "",
      priceReais: 0,
      totalQuantity: 1,
    },
    validate: {
      name: (value) => (String(value).trim().length >= 2 ? null : "Informe o nome do lote"),
      priceReais: (value) =>
        Number(value) >= 0 && !Number.isNaN(Number(value))
          ? null
          : "Preço inválido",
      totalQuantity: (value) =>
        Number(value) > 0 && !Number.isNaN(Number(value))
          ? null
          : "Quantidade inválida",
    },
  });

  const openEditLot = (lot: TicketLot) => {
    setLotToEdit(lot);
    editLotForm.setValues({
      name: lot.name,
      priceReais: lot.price / 100,
      totalQuantity: lot.totalQuantity,
    });
    editLotForm.clearErrors();
  };

  const canEditLotPrice =
    lotToEdit !== null && lotToEdit.totalQuantity - lotToEdit.availableQuantity === 0;

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
          date: isoToEventDate(data.date),
          location: data.location,
          imageUrl: data.imageUrl ?? "",
          status: data.status,
          type: data.type ?? "PUBLIC",
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

  const statusOptions = useMemo(
    () => getAllowedEventStatusOptions((event?.status ?? "DRAFT") as EventStatus),
    [event?.status],
  );

  const statusHint = useMemo(
    () => getEventStatusTransitionHint((event?.status ?? "DRAFT") as EventStatus),
    [event?.status],
  );

  const canChangeEventType = event?.status === "DRAFT";
  const pendingParticipationCount = event?.pendingParticipationCount ?? 0;

  const statusConfirmation = pendingStatus
    ? getEventStatusConfirmationCopy(pendingStatus)
    : null;

  const handleStatusChange = (nextValue: string | null) => {
    if (!nextValue || !event) {
      return;
    }

    const nextStatus = nextValue as EventStatus;
    const currentStatus = eventForm.values.status as EventStatus;

    if (requiresEventStatusConfirmation(currentStatus, nextStatus)) {
      setPendingStatus(nextStatus);
      return;
    }

    eventForm.setFieldValue("status", nextStatus);
  };

  const confirmPendingStatus = () => {
    if (pendingStatus) {
      eventForm.setFieldValue("status", pendingStatus);
    }
    setPendingStatus(null);
  };

  const cancelPendingStatus = () => {
    setPendingStatus(null);
  };

  const reloadEvent = async () => {
    if (!eventId) {
      return;
    }

    const data = await eventService.getManagedEvent(eventId);
    if (data) {
      setEvent(data);
      eventForm.setFieldValue("type", data.type ?? "PUBLIC");
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
        date: eventDateToIso(values.date!),
        location: values.location.trim(),
        imageUrl: values.imageUrl.trim() || null,
        status: values.status as EventStatus,
        type: values.type,
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

  const canManageLots =
    event?.status === "DRAFT" || event?.status === "PUBLISHED";
  const isLastPublishedLot =
    event?.status === "PUBLISHED" && (event.ticketLots.length ?? 0) <= 1;

  const confirmDeleteLot = async () => {
    if (!eventId || !lotToDelete) {
      return;
    }

    const deletedName = lotToDelete.name;
    setDeletingLot(true);

    try {
      await eventService.deleteTicketLot(eventId, lotToDelete.id);
      setLotToDelete(null);
      await reloadEvent();

      notifications.show({
        title: "Lote removido",
        message: `${deletedName} foi apagado.`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Não foi possível apagar",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setDeletingLot(false);
    }
  };

  const handleUpdateLot = editLotForm.onSubmit(async (values) => {
    if (!eventId || !lotToEdit) {
      return;
    }

    if (Number(values.totalQuantity) < lotToEdit.totalQuantity) {
      editLotForm.setFieldError(
        "totalQuantity",
        `A quantidade só pode aumentar (mínimo ${lotToEdit.totalQuantity})`,
      );
      return;
    }

    setSavingLotEdit(true);

    try {
      const payload: eventService.UpdateTicketLotInput = {
        name: String(values.name).trim(),
        totalQuantity: Number(values.totalQuantity),
      };

      if (canEditLotPrice) {
        payload.price = parsePriceToCents(values.priceReais);
      }

      await eventService.updateTicketLot(eventId, lotToEdit.id, payload);
      setLotToEdit(null);
      await reloadEvent();

      notifications.show({
        title: "Lote atualizado",
        message: "Alterações salvas com sucesso.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
    } catch (err) {
      notifications.show({
        title: "Não foi possível salvar",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setSavingLotEdit(false);
    }
  });

  if (loading) {
    return <PageLoader label="Carregando evento..." />;
  }

  if (error || !event) {
    return (
      <Stack gap="md">
        <PageBackNav to="/produtor/eventos" label="Voltar aos eventos" />
        <Alert icon={<IconAlertCircle size={18} />} color="red" title="Erro" radius="lg">
          {error ?? "Evento não encontrado."}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack gap={0}>
      <Modal
        opened={pendingStatus !== null}
        onClose={cancelPendingStatus}
        title={statusConfirmation?.title ?? "Confirmar alteração"}
        centered
        radius="lg"
      >
        <Stack gap="lg">
          <Text size="sm" style={{ lineHeight: 1.55 }}>
            {statusConfirmation?.message}
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={cancelPendingStatus} radius="xl">
              Voltar
            </Button>
            <Button
              color={statusConfirmation?.color ?? "red"}
              onClick={confirmPendingStatus}
              radius="xl"
            >
              {statusConfirmation?.confirmLabel ?? "Confirmar"}
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={lotToDelete !== null}
        onClose={() => {
          if (!deletingLot) {
            setLotToDelete(null);
          }
        }}
        title="Apagar lote"
        centered
        radius="lg"
      >
        <Stack gap="lg">
          <Text size="sm" style={{ lineHeight: 1.55 }}>
            Remover o lote <strong>{lotToDelete?.name}</strong>? Essa ação não pode ser
            desfeita. Só é possível apagar lotes sem vendas nem reservas em andamento.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button
              variant="default"
              onClick={() => setLotToDelete(null)}
              disabled={deletingLot}
              radius="xl"
            >
              Cancelar
            </Button>
            <Button
              color="red"
              leftSection={<IconTrash size={16} />}
              loading={deletingLot}
              onClick={() => void confirmDeleteLot()}
              radius="xl"
            >
              Apagar lote
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Modal
        opened={lotToEdit !== null}
        onClose={() => {
          if (!savingLotEdit) {
            setLotToEdit(null);
          }
        }}
        title="Editar lote"
        centered
        radius="lg"
      >
        <form onSubmit={handleUpdateLot}>
          <Stack gap="md">
            <TextInput
              label="Nome do lote"
              radius="md"
              {...editLotForm.getInputProps("name")}
            />
            <NumberInput
              label="Preço (R$)"
              decimalScale={2}
              fixedDecimalScale
              min={0}
              radius="md"
              disabled={!canEditLotPrice}
              description={
                canEditLotPrice
                  ? undefined
                  : "Preço bloqueado: este lote já tem reservas ou ingressos."
              }
              {...editLotForm.getInputProps("priceReais")}
            />
            <NumberInput
              label="Quantidade total"
              min={lotToEdit?.totalQuantity ?? 1}
              radius="md"
              description="Só é possível aumentar a quantidade."
              {...editLotForm.getInputProps("totalQuantity")}
            />
            <Group justify="flex-end" gap="sm" mt="sm">
              <Button
                variant="default"
                onClick={() => setLotToEdit(null)}
                disabled={savingLotEdit}
                radius="xl"
              >
                Cancelar
              </Button>
              <Button type="submit" loading={savingLotEdit} radius="xl">
                Salvar
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Box className="producer-manage-hero full-bleed" style={getEventCoverStyle(event)}>
        <Box className="producer-manage-hero-overlay" />
        <Container size="lg" px="md" className="producer-manage-hero-content">
          <Stack gap="md" maw={720}>
            <Stack gap="sm" maw={640}>
              <Group gap="sm" wrap="wrap">
                <EventStatusBadge status={event.status} size="sm" overlay />
                {event.type === "PRIVATE" ? <EventPrivateBadge size="sm" overlay /> : null}
                {pendingParticipationCount > 0 ? (
                  <PremiumBadge tone="warning" size="sm" overlay>
                    {pendingParticipationCount} solicitação
                    {pendingParticipationCount === 1 ? "" : "ões"} pendente
                    {pendingParticipationCount === 1 ? "" : "s"}
                  </PremiumBadge>
                ) : null}
                <PremiumBadge tone="glass" size="sm" overlay>
                  {event.ticketLots.length} lote{event.ticketLots.length === 1 ? "" : "s"}
                </PremiumBadge>
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
          </Stack>
        </Container>
      </Box>

      <Box className="page-body">
        <Container size="lg" py="xl" px="md">
          <PageBackNav to="/produtor/eventos" label="Voltar aos eventos" />
          <Stack gap="xl" mt="lg">
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
              <PremiumPaper p="xl" h="100%">
                <form onSubmit={handleSaveEvent} style={{ height: "100%" }}>
                  <Stack gap="lg" h="100%" justify="space-between">
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
                        minRows={3}
                        radius="md"
                        {...eventForm.getInputProps("description")}
                      />
                      <EventDateTimeField
                        value={eventForm.values.date}
                        onChange={(value) => eventForm.setFieldValue("date", value)}
                        error={eventForm.errors.date}
                        description="Horário local do evento."
                      />
                      <TextInput label="Local" radius="md" {...eventForm.getInputProps("location")} />
                      <Select
                        label="Tipo de evento"
                        radius="md"
                        allowDeselect={false}
                        comboboxProps={{ withinPortal: true }}
                        data={[...EVENT_TYPE_OPTIONS]}
                        disabled={!canChangeEventType}
                        description={
                          canChangeEventType
                            ? "Privado exige aprovação antes da compra. Só em rascunho, sem solicitações ou vendas."
                            : "Só pode alterar em rascunho, sem solicitações e sem vendas."
                        }
                        leftSection={<IconLock size={16} />}
                        {...eventForm.getInputProps("type")}
                      />
                      <TextInput
                        label="URL da imagem de capa"
                        placeholder="https://images.unsplash.com/..."
                        radius="md"
                        leftSection={<IconPhoto size={16} />}
                        description="Opcional. Capa nos cards e na página do evento."
                        {...eventForm.getInputProps("imageUrl")}
                      />
                      <Select
                        label="Status"
                        radius="md"
                        allowDeselect={false}
                        comboboxProps={{ withinPortal: true }}
                        data={statusOptions}
                        disabled={isTerminalEventStatus(event.status as EventStatus)}
                        description={statusHint ?? undefined}
                        value={eventForm.values.status}
                        onChange={handleStatusChange}
                        error={eventForm.errors.status}
                      />
                      {event.status === "CANCELLED" ? (
                        <Alert
                          color="red"
                          variant="light"
                          radius="lg"
                          icon={<IconAlertCircle size={18} />}
                          title="Evento cancelado"
                        >
                          Este evento não pode ser republicado. Para uma nova data ou edição
                          comercial, crie outro evento.
                        </Alert>
                      ) : null}
                    </Stack>
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
              <PremiumPaper p="xl" h="100%">
                <form onSubmit={handleCreateLot} style={{ height: "100%" }}>
                  <Stack gap="lg" h="100%">
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
                        min={0}
                        radius="md"
                        {...lotForm.getInputProps("priceReais")}
                      />
                      <NumberInput
                        label="Quantidade total"
                        min={1}
                        radius="md"
                        {...lotForm.getInputProps("totalQuantity")}
                      />
                    </Stack>

                    <Alert
                      variant="light"
                      color="teal"
                      radius="md"
                      p="md"
                      icon={<IconBulb size={18} />}
                      title="Dicas"
                      styles={{
                        wrapper: { alignItems: "flex-start" },
                      }}
                    >
                      <Stack gap={6} mt={4} component="ul" style={{ margin: 0, paddingLeft: "1.1rem" }}>
                        {LOT_FORM_TIPS.map((tip) => (
                          <Text
                            key={tip}
                            component="li"
                            size="sm"
                            style={{ lineHeight: 1.45 }}
                          >
                            {tip}
                          </Text>
                        ))}
                      </Stack>
                    </Alert>

                    <Box style={{ flex: 1 }} />

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
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm">
              <Stack gap={4}>
                <Title order={3} size="h4" className="producer-section-title">
                  Lotes cadastrados
                </Title>
                <Text c="dimmed" size="sm">
                  Preço, estoque e ocupação de cada lote.
                </Text>
              </Stack>
              {event.ticketLots.length > 0 ? (
                <PremiumBadge tone="brand" size="md">
                  {event.ticketLots.length} lote
                  {event.ticketLots.length === 1 ? "" : "s"}
                </PremiumBadge>
              ) : null}
            </Group>

            {event.ticketLots.length === 0 ? (
              <PremiumPaper p="xl">
                <EmptyState
                  icon={<IconTicket size={32} />}
                  title="Nenhum lote cadastrado"
                  description="Use o formulário Novo lote ao lado dos detalhes para adicionar o primeiro."
                />
              </PremiumPaper>
            ) : (
              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
                {event.ticketLots.map((lot) => {
                  const sold = lot.totalQuantity - lot.availableQuantity;
                  const canDeleteLot =
                    Boolean(canManageLots) && !isLastPublishedLot && sold === 0;

                  return (
                    <ProducerLotCard
                      key={lot.id}
                      lot={lot}
                      canEdit={Boolean(canManageLots)}
                      canDelete={canDeleteLot}
                      deleting={deletingLot && lotToDelete?.id === lot.id}
                      onEdit={openEditLot}
                      onDelete={setLotToDelete}
                    />
                  );
                })}
              </SimpleGrid>
            )}
          </Stack>

          <SimpleGrid
            cols={{
              base: 1,
              md: event.type === "PRIVATE" ? 2 : 1,
            }}
            spacing="xl"
          >
            {event.type === "PRIVATE" ? (
              <ProducerParticipationPanel
                eventId={event.id}
                onReviewComplete={() => void reloadEvent()}
              />
            ) : null}
            <ProducerCheckInStaffPanel eventId={event.id} />
          </SimpleGrid>
          </Stack>
        </Container>
      </Box>
    </Stack>
  );
}
