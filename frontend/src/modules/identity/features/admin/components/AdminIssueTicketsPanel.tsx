/**
 * @file Painel super admin para emissão manual de ingressos (cortesia/offline).
 * @module components/admin/AdminIssueTicketsPanel
 */

import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Badge,
  Button,
  Divider,
  Grid,
  Group,
  Modal,
  NumberInput,
  Paper,
  Select,
  Stack,
  Switch,
  Text,
  TextInput,
} from "@mantine/core";
import { useDisclosure, useMediaQuery } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconMail, IconSearch, IconTicket, IconUser } from "@tabler/icons-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { AdminSection } from "./AdminSection";
import * as authService from "@/modules/identity/api/authService";
import * as eventService from "@/modules/catalog/api/eventService";
import * as adminTicketService from "@/modules/ticketing/api/adminTicketService";
import type { AuthUser, Event, TicketLot } from "@/shared/types/api";
import { formatCurrencyFromCents } from "@/shared/utils/format";
import { getApiErrorMessage } from "@/shared/utils/errors";
import { getRoleBadgeColor, ROLE_LABELS } from "@/modules/identity/features/admin/utils/adminRoles";

interface AdminIssueTicketsPanelProps {
  onIssued?: () => void;
}

export function AdminIssueTicketsPanel({ onIssued }: AdminIssueTicketsPanelProps) {
  const isMobile = useMediaQuery("(max-width: 47.99em)");
  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AuthUser | null>(null);

  const [issueLoading, setIssueLoading] = useState(false);
  const [lastIssue, setLastIssue] = useState<adminTicketService.IssueManualTicketResult | null>(
    null,
  );
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const userForm = useForm({
    initialValues: { email: "" },
    validate: {
      email: (value) =>
        /^\S+@\S+\.\S+$/.test(value.trim()) ? null : "E-mail inválido",
    },
  });

  const issueForm = useForm({
    initialValues: {
      eventId: "",
      ticketLotId: "",
      quantity: 1,
      sendEmail: true,
      reason: "",
    },
    validate: {
      eventId: (value) => (value ? null : "Selecione um evento"),
      ticketLotId: (value) => (value ? null : "Selecione um lote"),
      quantity: (value) =>
        Number.isInteger(value) && value >= 1 ? null : "Informe uma quantidade válida",
    },
  });

  useEffect(() => {
    let cancelled = false;

    setEventsLoading(true);
    setEventsError(null);

    eventService
      .listManagedEvents()
      .then((data) => {
        if (!cancelled) {
          setEvents(data.filter((event) => event.ticketLots.length > 0));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setEventsError(getApiErrorMessage(err, "Não foi possível carregar os eventos."));
        }
      })
      .finally(() => {
        if (!cancelled) {
          setEventsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const selectedEvent = useMemo(
    () => events.find((event) => event.id === issueForm.values.eventId) ?? null,
    [events, issueForm.values.eventId],
  );

  const availableLots = useMemo(
    () =>
      (selectedEvent?.ticketLots ?? []).filter((lot) => lot.availableQuantity > 0),
    [selectedEvent],
  );

  const selectedLot = useMemo(
    () => availableLots.find((lot) => lot.id === issueForm.values.ticketLotId) ?? null,
    [availableLots, issueForm.values.ticketLotId],
  );

  const eventOptions = events.map((event) => ({
    value: event.id,
    label: event.title,
  }));

  const lotOptions = availableLots.map((lot: TicketLot) => ({
    value: lot.id,
    label: `${lot.name} · ${formatCurrencyFromCents(lot.price)} · ${lot.availableQuantity} disp.`,
  }));

  const maxQuantity = selectedLot
    ? Math.min(20, selectedLot.availableQuantity)
    : 20;

  const handleLookupUser = userForm.onSubmit(async (values) => {
    setLookupLoading(true);
    setLookupError(null);
    setSelectedUser(null);

    try {
      const user = await authService.lookupUserByEmail(values.email.trim());
      setSelectedUser(user);
    } catch (err) {
      setLookupError(getApiErrorMessage(err, "Usuário não encontrado."));
    } finally {
      setLookupLoading(false);
    }
  });

  const handleSubmitIssue = issueForm.onSubmit(() => {
    if (!selectedUser) {
      notifications.show({
        title: "Selecione o destinatário",
        message: "Busque o usuário pelo e-mail antes de emitir os ingressos.",
        color: "orange",
      });
      return;
    }

    openConfirm();
  });

  const handleConfirmIssue = async () => {
    if (!selectedUser || !selectedLot) {
      return;
    }

    setIssueLoading(true);

    try {
      const issue = await adminTicketService.issueManualTicket({
        userId: selectedUser.id,
        ticketLotId: selectedLot.id,
        quantity: issueForm.values.quantity,
        sendEmail: issueForm.values.sendEmail,
        reason: issueForm.values.reason.trim() || undefined,
      });

      setLastIssue(issue);
      closeConfirm();

      notifications.show({
        title: "Ingressos emitidos",
        message: issue.emailQueued
          ? `${issue.ticketsIssued} ingresso(s) criado(s) e e-mail enfileirado para ${issue.userEmail}.`
          : `${issue.ticketsIssued} ingresso(s) criado(s) para ${issue.userEmail}.`,
        color: "green",
      });

      onIssued?.();

      const refreshed = await eventService.listManagedEvents();
      setEvents(refreshed.filter((event) => event.ticketLots.length > 0));

      if (selectedLot.availableQuantity <= issueForm.values.quantity) {
        issueForm.setFieldValue("ticketLotId", "");
      }
    } catch (err) {
      notifications.show({
        title: "Não foi possível emitir",
        message: getApiErrorMessage(err, "Tente novamente em instantes."),
        color: "red",
      });
    } finally {
      setIssueLoading(false);
    }
  };

  return (
    <>
      <AdminSection
        icon={IconTicket}
        iconColor="brand"
        title="Emitir ingressos manualmente"
        description="Libere ingressos fora do fluxo de pagamento para um usuário específico. A emissão consome estoque do lote."
      >
        <Stack gap="xl">
          <Stack gap="md">
            <Text fw={600}>1. Destinatário</Text>
            <form onSubmit={handleLookupUser}>
              <Grid align="flex-end" gap="md">
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <TextInput
                    label="E-mail do usuário"
                    placeholder="cliente@email.com"
                    leftSection={<IconSearch size={16} />}
                    radius="md"
                    {...userForm.getInputProps("email")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Button type="submit" radius="xl" loading={lookupLoading} fullWidth>
                    Buscar usuário
                  </Button>
                </Grid.Col>
              </Grid>
            </form>

            {lookupError ? (
              <Alert color="red" variant="light" radius="lg">
                {lookupError}
              </Alert>
            ) : null}

            {selectedUser ? (
              <Paper className="admin-result-card" p="md" radius="lg" withBorder>
                <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
                  <Stack gap={4}>
                    <Text fw={700}>{selectedUser.name}</Text>
                    <Text size="sm" c="dimmed">
                      {selectedUser.email}
                    </Text>
                    <Text size="xs" c="dimmed" className="admin-mono-id">
                      {selectedUser.id}
                    </Text>
                  </Stack>
                  <Badge color={getRoleBadgeColor(selectedUser.role)} variant="light" size="lg">
                    {ROLE_LABELS[selectedUser.role]}
                  </Badge>
                </Group>
              </Paper>
            ) : (
              <EmptyState
                icon={<IconUser size={28} />}
                title="Nenhum usuário selecionado"
                description="Busque pelo e-mail de quem receberá os ingressos."
              />
            )}
          </Stack>

          <Divider />

          <form onSubmit={handleSubmitIssue}>
            <Stack gap="md">
              <Text fw={600}>2. Evento e lote</Text>

              {eventsError ? (
                <Alert color="red" variant="light" radius="lg">
                  {eventsError}
                </Alert>
              ) : null}

              <Grid gap="md">
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Evento"
                    placeholder={eventsLoading ? "Carregando..." : "Selecione o evento"}
                    data={eventOptions}
                    searchable
                    nothingFoundMessage="Nenhum evento com lotes"
                    disabled={eventsLoading}
                    radius="md"
                    {...issueForm.getInputProps("eventId")}
                    onChange={(value) => {
                      issueForm.setFieldValue("eventId", value ?? "");
                      issueForm.setFieldValue("ticketLotId", "");
                    }}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <Select
                    label="Lote"
                    placeholder={
                      selectedEvent ? "Selecione o lote" : "Escolha um evento primeiro"
                    }
                    data={lotOptions}
                    searchable
                    nothingFoundMessage="Nenhum lote com estoque"
                    disabled={!selectedEvent || availableLots.length === 0}
                    radius="md"
                    {...issueForm.getInputProps("ticketLotId")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 4 }}>
                  <NumberInput
                    label="Quantidade"
                    min={1}
                    max={maxQuantity}
                    allowDecimal={false}
                    radius="md"
                    {...issueForm.getInputProps("quantity")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, sm: 8 }}>
                  <TextInput
                    label="Motivo (opcional)"
                    placeholder="Ex.: cortesia do produtor, parceiro VIP"
                    radius="md"
                    {...issueForm.getInputProps("reason")}
                  />
                </Grid.Col>
              </Grid>

              <Switch
                label="Enviar ingressos por e-mail ao concluir"
                description="Dispara o mesmo e-mail com PDF usado após o pagamento."
                checked={issueForm.values.sendEmail}
                onChange={(event) =>
                  issueForm.setFieldValue("sendEmail", event.currentTarget.checked)
                }
              />

              <Group justify="flex-end">
                <Button
                  type="submit"
                  radius="xl"
                  leftSection={<IconTicket size={16} />}
                  disabled={!selectedUser || !selectedLot}
                >
                  Revisar emissão
                </Button>
              </Group>
            </Stack>
          </form>

          {lastIssue ? (
            <>
              <Divider />
              <Paper className="admin-result-card admin-result-card--compact" p="md" radius="lg" withBorder>
                <Stack gap="xs">
                  <Group gap="xs">
                    <IconMail size={16} />
                    <Text fw={700}>Última emissão</Text>
                  </Group>
                  <Text size="sm">
                    {lastIssue.ticketsIssued} ingresso(s) para{" "}
                    <Text span fw={600}>
                      {lastIssue.userName}
                    </Text>{" "}
                    em{" "}
                    <Text span fw={600}>
                      {lastIssue.eventTitle}
                    </Text>{" "}
                    ({lastIssue.lotName}).
                  </Text>
                  <Text size="xs" c="dimmed" className="admin-mono-id">
                    Pedido {lastIssue.orderId}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {lastIssue.emailQueued
                      ? "E-mail enfileirado para envio."
                      : "E-mail não enviado nesta emissão."}
                  </Text>
                </Stack>
              </Paper>
            </>
          ) : null}
        </Stack>
      </AdminSection>

      <Modal
        opened={confirmOpened}
        onClose={closeConfirm}
        title="Confirmar emissão manual"
        centered={!isMobile}
        fullScreen={isMobile}
        radius="lg"
        classNames={{ title: "admin-modal-title" }}
      >
        <Stack gap="md" className="admin-modal-body">
          <Text size="sm">
            Emitir{" "}
            <Text span fw={600}>
              {issueForm.values.quantity}
            </Text>{" "}
            ingresso(s) de{" "}
            <Text span fw={600}>
              {selectedLot?.name}
            </Text>{" "}
            para{" "}
            <Text span fw={600}>
              {selectedUser?.email}
            </Text>
            ?
          </Text>
          <Text size="sm" c="dimmed">
            O pedido será registrado como pago (R$ 0,00) e o estoque do lote será decrementado.
            {issueForm.values.sendEmail
              ? " Os ingressos serão enviados por e-mail em seguida."
              : " Nenhum e-mail será enviado agora."}
          </Text>
          <Stack gap="sm" className="admin-modal-actions">
            <Button
              radius="xl"
              loading={issueLoading}
              onClick={() => void handleConfirmIssue()}
              fullWidth
            >
              Confirmar emissão
            </Button>
            <Button variant="default" radius="xl" onClick={closeConfirm} fullWidth>
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </Modal>
    </>
  );
}
