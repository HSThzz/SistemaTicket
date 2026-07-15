/**
 * @file Painel do produtor para aprovar/recusar solicitações e ver quem pagou.
 * @module components/producer/ProducerParticipationPanel
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Checkbox,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Select,
  Stack,
  Text,
  TextInput,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandInstagram,
  IconCheck,
  IconMail,
  IconPencil,
  IconPhone,
  IconReceipt,
  IconRefresh,
  IconSearch,
  IconTicket,
  IconUserCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { EmptyState } from "@/shared/components/EmptyState";
import { PremiumPaper } from "@/shared/components/PremiumPaper";
import * as participationService from "@/modules/participation/api/participationService";
import * as orderService from "@/modules/sales/api/orderService";
import type {
  PaidParticipant,
  ParticipationRequest,
  ParticipationRequestStatus,
  TicketLot,
} from "@/shared/types/api";
import { getApiErrorMessage } from "@/shared/utils/errors";
import {
  buildInstagramProfileUrl,
  formatCurrencyFromCents,
  formatEventDate,
  formatLotPrice,
} from "@/shared/utils/format";
import { ParticipationStatusBadge } from "@/components/ui/ParticipationStatusBadge";
import { PremiumBadge } from "@/components/ui/PremiumBadge";

type PanelFilter = ParticipationRequestStatus | "PAID";
type PaymentFilter = "ALL" | "PAID" | "UNPAID";

const PANEL_FILTERS: { value: PanelFilter; label: string }[] = [
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Recusadas" },
  { value: "PAID", label: "Pagos" },
];

const PAGE_SIZE = 12;

function compareByNameAsc(a: string, b: string): number {
  return a.localeCompare(b, "pt-BR", { sensitivity: "base" });
}

function matchesSearch(
  name: string,
  email: string,
  query: string,
): boolean {
  if (!query) {
    return true;
  }
  const normalized = query.trim().toLowerCase();
  return (
    name.toLowerCase().includes(normalized) ||
    email.toLowerCase().includes(normalized)
  );
}

/** Card individual de uma solicitação com dados de contato e ações. */
function RequestRow({
  request,
  acting,
  lotNameById,
  onApproveClick,
  onEditLotsClick,
  onReject,
}: {
  request: ParticipationRequest;
  acting: boolean;
  lotNameById: Map<string, string>;
  onApproveClick: (request: ParticipationRequest) => void;
  onEditLotsClick: (request: ParticipationRequest) => void;
  onReject: (id: string) => void;
}) {
  const isPending = request.status === "PENDING";
  const isApproved = request.status === "APPROVED";
  const allowedLotLabels =
    request.allowedTicketLotIds
      ?.map((id) => lotNameById.get(id) ?? "Lote removido")
      .filter(Boolean) ?? [];

  return (
    <Box className="lot-offer-card" p="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Stack gap={6} flex={1} miw={200}>
          <Group gap="sm" wrap="wrap">
            <Text fw={700} lineClamp={1}>
              {request.name}
            </Text>
            <ParticipationStatusBadge status={request.status} size="xs" />
            {isApproved && request.hasPaid ? (
              <PremiumBadge tone="paid" size="xs">
                Pago
              </PremiumBadge>
            ) : null}
          </Group>
          <Group gap="lg" wrap="wrap" c="dimmed">
            <Group gap={6} wrap="nowrap">
              <IconMail size={15} />
              <Text size="sm">{request.email}</Text>
            </Group>
            {request.phone ? (
              <Group gap={6} wrap="nowrap">
                <IconPhone size={15} />
                <Text size="sm">{request.phone}</Text>
              </Group>
            ) : null}
            {request.instagramHandle ? (
              <Group gap={6} wrap="nowrap">
                <IconBrandInstagram size={15} />
                <Anchor
                  href={buildInstagramProfileUrl(request.instagramHandle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  fw={600}
                >
                  @{request.instagramHandle}
                </Anchor>
              </Group>
            ) : null}
          </Group>
          <Text size="xs" c="dimmed">
            Enviada em {formatEventDate(request.createdAt)}
          </Text>
          {isApproved && allowedLotLabels.length > 0 ? (
            <Text size="xs" c="dimmed">
              Lotes liberados: {allowedLotLabels.join(", ")}
            </Text>
          ) : null}
        </Stack>

        {isPending ? (
          <Group gap="sm" wrap="nowrap">
            <Button
              radius="xl"
              size="xs"
              color="green"
              leftSection={<IconCheck size={16} />}
              loading={acting}
              onClick={() => onApproveClick(request)}
            >
              Aprovar
            </Button>
            <Button
              radius="xl"
              size="xs"
              variant="light"
              color="red"
              leftSection={<IconX size={16} />}
              disabled={acting}
              onClick={() => onReject(request.id)}
            >
              Recusar
            </Button>
          </Group>
        ) : null}

        {isApproved ? (
          <Button
            radius="xl"
            size="xs"
            variant="light"
            leftSection={<IconPencil size={16} />}
            loading={acting}
            onClick={() => onEditLotsClick(request)}
          >
            Editar lotes
          </Button>
        ) : null}
      </Group>
    </Box>
  );
}

/** Card de comprador com pedido pago e ação de reembolso. */
function PaidRow({
  participant,
  acting,
  onRefundClick,
}: {
  participant: PaidParticipant;
  acting: boolean;
  onRefundClick: (participant: PaidParticipant) => void;
}) {
  return (
    <Box className="lot-offer-card" p="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Stack gap={6} flex={1} miw={200}>
          <Text fw={700} lineClamp={1}>
            {participant.name}
          </Text>
          <Group gap="lg" wrap="wrap" c="dimmed">
            <Group gap={6} wrap="nowrap">
              <IconMail size={15} />
              <Text size="sm">{participant.email}</Text>
            </Group>
            {participant.instagramHandle ? (
              <Group gap={6} wrap="nowrap">
                <IconBrandInstagram size={15} />
                <Anchor
                  href={buildInstagramProfileUrl(participant.instagramHandle)}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="sm"
                  fw={600}
                >
                  @{participant.instagramHandle}
                </Anchor>
              </Group>
            ) : null}
            <Group gap={6} wrap="nowrap">
              <IconTicket size={15} />
              <Text size="sm">
                {participant.ticketCount} ingresso
                {participant.ticketCount === 1 ? "" : "s"} ·{" "}
                {formatCurrencyFromCents(participant.totalPriceCents)}
              </Text>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">
            Pago em {formatEventDate(participant.paidAt)}
            {" · "}
            {participant.ticketLotName}
          </Text>
        </Stack>
        <Button
          radius="xl"
          size="xs"
          variant="light"
          color="red"
          loading={acting}
          onClick={() => onRefundClick(participant)}
        >
          Reembolsar
        </Button>
      </Group>
    </Box>
  );
}

/**
 * Lista e gerencia solicitações de participação de um evento privado.
 *
 * @param props.eventId - Identificador do evento gerenciado.
 * @param props.ticketLots - Lotes atuais do evento (para escolher na aprovação).
 */
export function ProducerParticipationPanel({
  eventId,
  ticketLots,
  onReviewComplete,
}: {
  eventId: string;
  ticketLots: TicketLot[];
  onReviewComplete?: () => void;
}) {
  const [panelFilter, setPanelFilter] = useState<PanelFilter>("PENDING");
  const [lotFilter, setLotFilter] = useState<string | null>(null);
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [paidParticipants, setPaidParticipants] = useState<PaidParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaidParticipant | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);
  const [approveTarget, setApproveTarget] = useState<ParticipationRequest | null>(
    null,
  );
  const [lotsModalMode, setLotsModalMode] = useState<"approve" | "edit">("approve");
  const [selectedLotIds, setSelectedLotIds] = useState<string[]>([]);

  const lotNameById = useMemo(
    () => new Map(ticketLots.map((lot) => [lot.id, lot.name])),
    [ticketLots],
  );

  const lotFilterOptions = useMemo(
    () =>
      ticketLots.map((lot) => ({
        value: lot.id,
        label: lot.name,
      })),
    [ticketLots],
  );

  const load = useCallback(
    async (filter: PanelFilter) => {
      setLoading(true);
      try {
        if (filter === "PAID") {
          const data = await participationService.listPaidParticipants(eventId);
          setPaidParticipants(
            [...data].sort((a, b) => compareByNameAsc(a.name, b.name)),
          );
          setRequests([]);
        } else {
          const data = await participationService.listParticipationRequests(
            eventId,
            filter,
          );
          const sorted =
            filter === "PENDING"
              ? data
              : [...data].sort((a, b) => compareByNameAsc(a.name, b.name));
          setRequests(sorted);
          setPaidParticipants([]);
        }
      } catch (err) {
        notifications.show({
          title:
            filter === "PAID"
              ? "Erro ao carregar pagamentos"
              : "Erro ao carregar solicitações",
          message: getApiErrorMessage(err),
          color: "red",
          icon: <IconX size={18} />,
        });
      } finally {
        setLoading(false);
      }
    },
    [eventId],
  );

  useEffect(() => {
    void load(panelFilter);
  }, [load, panelFilter]);

  useEffect(() => {
    setLotFilter(null);
    setPaymentFilter("ALL");
    setSearchQuery("");
    setVisibleCount(PAGE_SIZE);
  }, [panelFilter]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [lotFilter, paymentFilter, searchQuery]);

  const filteredRequests = useMemo(() => {
    return requests.filter((request) => {
      if (!matchesSearch(request.name, request.email, searchQuery)) {
        return false;
      }

      if (
        lotFilter &&
        !(request.allowedTicketLotIds ?? []).includes(lotFilter)
      ) {
        return false;
      }

      if (panelFilter === "APPROVED") {
        if (paymentFilter === "PAID" && !request.hasPaid) {
          return false;
        }
        if (paymentFilter === "UNPAID" && request.hasPaid) {
          return false;
        }
      }

      return true;
    });
  }, [requests, searchQuery, lotFilter, panelFilter, paymentFilter]);

  const filteredPaid = useMemo(() => {
    return paidParticipants.filter((participant) => {
      if (!matchesSearch(participant.name, participant.email, searchQuery)) {
        return false;
      }
      if (lotFilter && participant.ticketLotId !== lotFilter) {
        return false;
      }
      return true;
    });
  }, [paidParticipants, searchQuery, lotFilter]);

  const isPaidTab = panelFilter === "PAID";
  const filteredListLength = isPaidTab
    ? filteredPaid.length
    : filteredRequests.length;
  const visibleRequests = filteredRequests.slice(0, visibleCount);
  const visiblePaid = filteredPaid.slice(0, visibleCount);
  const hasMore = filteredListLength > visibleCount;
  const showLotFilter =
    ticketLots.length > 0 &&
    (panelFilter === "APPROVED" || panelFilter === "PAID");
  const showPaymentFilter = panelFilter === "APPROVED";
  const isEmptySource = isPaidTab
    ? paidParticipants.length === 0
    : requests.length === 0;
  const isEmptyFiltered = !isEmptySource && filteredListLength === 0;
  const approveActing = Boolean(approveTarget && actingId === approveTarget.id);

  const openApproveModal = (request: ParticipationRequest) => {
    if (ticketLots.length === 0) {
      notifications.show({
        title: "Sem lotes",
        message: "Crie ao menos um lote de ingressos antes de aprovar.",
        color: "orange",
        icon: <IconX size={18} />,
      });
      return;
    }

    setLotsModalMode("approve");
    setApproveTarget(request);
    setSelectedLotIds(ticketLots.map((lot) => lot.id));
  };

  const openEditLotsModal = (request: ParticipationRequest) => {
    if (ticketLots.length === 0) {
      notifications.show({
        title: "Sem lotes",
        message: "Crie ao menos um lote de ingressos antes de editar.",
        color: "orange",
        icon: <IconX size={18} />,
      });
      return;
    }

    const currentIds = (request.allowedTicketLotIds ?? []).filter((id) =>
      ticketLots.some((lot) => lot.id === id),
    );

    setLotsModalMode("edit");
    setApproveTarget(request);
    setSelectedLotIds(currentIds.length > 0 ? currentIds : ticketLots.map((lot) => lot.id));
  };

  const handleReview = async (
    id: string,
    decision: "APPROVE" | "REJECT",
    ticketLotIds?: string[],
  ) => {
    setActingId(id);
    try {
      await participationService.reviewParticipationRequest(
        eventId,
        id,
        decision,
        ticketLotIds,
      );
      setRequests((current) => current.filter((request) => request.id !== id));
      notifications.show({
        title: decision === "APPROVE" ? "Solicitação aprovada" : "Solicitação recusada",
        message:
          decision === "APPROVE"
            ? "O participante só poderá comprar nos lotes liberados."
            : "A solicitação foi recusada.",
        color: decision === "APPROVE" ? "green" : "orange",
        icon: <IconCheck size={18} />,
      });

      setApproveTarget(null);
      onReviewComplete?.();
    } catch (err) {
      notifications.show({
        title: "Não foi possível concluir",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setActingId(null);
    }
  };

  const handleUpdateAllowedLots = async (id: string, ticketLotIds: string[]) => {
    setActingId(id);
    try {
      const updated = await participationService.updateAllowedTicketLots(
        eventId,
        id,
        ticketLotIds,
      );
      setRequests((current) =>
        current.map((request) => (request.id === id ? updated : request)),
      );
      notifications.show({
        title: "Lotes atualizados",
        message: "Os lotes liberados para este participante foram salvos.",
        color: "green",
        icon: <IconCheck size={18} />,
      });
      setApproveTarget(null);
      onReviewComplete?.();
    } catch (err) {
      notifications.show({
        title: "Não foi possível salvar",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setActingId(null);
    }
  };

  const handleConfirmLotsModal = () => {
    if (!approveTarget) {
      return;
    }
    if (selectedLotIds.length === 0) {
      notifications.show({
        title: "Selecione lotes",
        message: "Escolha ao menos um lote para liberar.",
        color: "orange",
        icon: <IconX size={18} />,
      });
      return;
    }

    if (lotsModalMode === "edit") {
      void handleUpdateAllowedLots(approveTarget.id, selectedLotIds);
      return;
    }

    void handleReview(approveTarget.id, "APPROVE", selectedLotIds);
  };

  const handleConfirmRefund = async () => {
    if (!refundTarget) {
      return;
    }

    setRefundLoading(true);
    try {
      await orderService.refundOrder(refundTarget.orderId);
      setPaidParticipants((current) =>
        current.filter((item) => item.orderId !== refundTarget.orderId),
      );
      notifications.show({
        title: "Reembolso processado",
        message: `O pedido de ${refundTarget.name} foi reembolsado e os ingressos foram cancelados.`,
        color: "green",
        icon: <IconCheck size={18} />,
      });
      setRefundTarget(null);
      onReviewComplete?.();
    } catch (err) {
      notifications.show({
        title: "Reembolso falhou",
        message: getApiErrorMessage(err),
        color: "red",
        icon: <IconX size={18} />,
      });
    } finally {
      setRefundLoading(false);
    }
  };

  return (
    <PremiumPaper p="xl">
      <Stack gap="lg">
        <Group justify="space-between" align="center" wrap="wrap" gap="sm">
          <Group gap="sm" className="producer-form-section-title">
            <ThemeIcon size={36} radius="md" variant="light" color="grape">
              <IconUserCheck size={18} />
            </ThemeIcon>
            <Stack gap={2}>
              <Title order={3} size="h4" className="producer-section-title">
                Solicitações de participação
              </Title>
              <Text size="sm" c="dimmed">
                Ao aprovar, escolha quais lotes a pessoa poderá comprar.
              </Text>
            </Stack>
          </Group>
          <Tooltip label="Atualizar">
            <ActionIcon
              variant="light"
              radius="xl"
              size="lg"
              onClick={() => void load(panelFilter)}
              aria-label="Atualizar lista"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <Box className="filter-pills-scroll">
          <SegmentedControl
            className="filter-pills"
            fullWidth
            radius="xl"
            value={panelFilter}
            onChange={(value) => setPanelFilter(value as PanelFilter)}
            data={PANEL_FILTERS}
          />
        </Box>

        {!loading && !isEmptySource ? (
          <Stack gap="sm">
            <TextInput
              placeholder="Buscar por nome ou e-mail"
              radius="md"
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.currentTarget.value)}
            />
            {(showLotFilter || showPaymentFilter) ? (
              <Group grow preventGrowOverflow={false} align="flex-start">
                {showLotFilter ? (
                  <Select
                    label="Lote"
                    placeholder="Todos os lotes"
                    radius="md"
                    data={lotFilterOptions}
                    value={lotFilter}
                    onChange={setLotFilter}
                    clearable
                  />
                ) : null}
                {showPaymentFilter ? (
                  <Select
                    label="Pagamento"
                    radius="md"
                    data={[
                      { value: "ALL", label: "Todos" },
                      { value: "UNPAID", label: "Ainda não pagaram" },
                      { value: "PAID", label: "Já pagaram" },
                    ]}
                    value={paymentFilter}
                    onChange={(value) =>
                      setPaymentFilter((value as PaymentFilter) ?? "ALL")
                    }
                    allowDeselect={false}
                  />
                ) : null}
              </Group>
            ) : null}
            {filteredListLength > 0 ? (
              <Text size="xs" c="dimmed">
                Mostrando {Math.min(visibleCount, filteredListLength)} de{" "}
                {filteredListLength}
              </Text>
            ) : null}
          </Stack>
        ) : null}

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : isEmptySource ? (
          <EmptyState
            icon={isPaidTab ? <IconReceipt size={32} /> : <IconUsers size={32} />}
            title={isPaidTab ? "Ninguém pagou ainda" : "Nenhuma solicitação"}
            description={
              isPaidTab
                ? "Quando um participante aprovado concluir o pagamento, o pedido aparece aqui."
                : panelFilter === "PENDING"
                  ? "Quando alguém solicitar participação, aparecerá aqui para sua aprovação."
                  : "Nenhuma solicitação neste status por enquanto."
            }
          />
        ) : isEmptyFiltered ? (
          <EmptyState
            icon={<IconSearch size={32} />}
            title="Nenhum resultado"
            description="Nada encontrado com esses filtros. Tente limpar a busca ou o lote."
          />
        ) : isPaidTab ? (
          <Stack gap="sm">
            {visiblePaid.map((participant) => (
              <PaidRow
                key={participant.orderId}
                participant={participant}
                acting={actingId === participant.orderId}
                onRefundClick={setRefundTarget}
              />
            ))}
            {hasMore ? (
              <Button
                variant="light"
                radius="xl"
                fullWidth
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Ver mais
              </Button>
            ) : null}
          </Stack>
        ) : (
          <Stack gap="sm">
            {visibleRequests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                acting={actingId === request.id}
                lotNameById={lotNameById}
                onApproveClick={openApproveModal}
                onEditLotsClick={openEditLotsModal}
                onReject={(id) => void handleReview(id, "REJECT")}
              />
            ))}
            {hasMore ? (
              <Button
                variant="light"
                radius="xl"
                fullWidth
                onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
              >
                Ver mais
              </Button>
            ) : null}
          </Stack>
        )}
      </Stack>

      <Modal
        opened={Boolean(approveTarget)}
        onClose={() => {
          if (!approveActing) {
            setApproveTarget(null);
          }
        }}
        title={
          lotsModalMode === "edit"
            ? "Editar lotes liberados"
            : "Liberar lotes na aprovação"
        }
        centered
        radius="lg"
      >
        {approveTarget ? (
          <Stack gap="md">
            <Text size="sm">
              Selecione os lotes que <Text span fw={700}>{approveTarget.name}</Text>{" "}
              poderá comprar neste evento.
            </Text>
            <Checkbox.Group value={selectedLotIds} onChange={setSelectedLotIds}>
              <Stack gap="xs">
                {ticketLots.map((lot) => (
                  <Checkbox
                    key={lot.id}
                    value={lot.id}
                    label={`${lot.name} · ${formatLotPrice(lot.price)}`}
                  />
                ))}
              </Stack>
            </Checkbox.Group>
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                radius="xl"
                disabled={approveActing}
                onClick={() => setApproveTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                color="green"
                radius="xl"
                loading={approveActing}
                onClick={handleConfirmLotsModal}
              >
                {lotsModalMode === "edit" ? "Salvar lotes" : "Confirmar aprovação"}
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>

      <Modal
        opened={Boolean(refundTarget)}
        onClose={() => {
          if (!refundLoading) {
            setRefundTarget(null);
          }
        }}
        title="Reembolsar pedido"
        centered
        radius="lg"
      >
        {refundTarget ? (
          <Stack gap="md">
            <Text size="sm">
              Reembolsar o pedido de <Text span fw={700}>{refundTarget.name}</Text> no valor de{" "}
              <Text span fw={700}>
                {formatCurrencyFromCents(refundTarget.totalPriceCents)}
              </Text>
              ? Os ingressos serão cancelados e a vaga volta ao estoque.
            </Text>
            <Group justify="flex-end" gap="sm">
              <Button
                variant="default"
                radius="xl"
                disabled={refundLoading}
                onClick={() => setRefundTarget(null)}
              >
                Cancelar
              </Button>
              <Button
                color="red"
                radius="xl"
                loading={refundLoading}
                onClick={() => void handleConfirmRefund()}
              >
                Confirmar reembolso
              </Button>
            </Group>
          </Stack>
        ) : null}
      </Modal>
    </PremiumPaper>
  );
}
