/**
 * @file Painel do produtor para aprovar/recusar solicitações e ver quem pagou.
 * @module components/producer/ProducerParticipationPanel
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Anchor,
  Box,
  Button,
  Group,
  Loader,
  Modal,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconBrandInstagram,
  IconCheck,
  IconMail,
  IconPhone,
  IconReceipt,
  IconRefresh,
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
} from "@/shared/types/api";
import { getApiErrorMessage } from "@/shared/utils/errors";
import {
  buildInstagramProfileUrl,
  formatCurrencyFromCents,
  formatEventDate,
} from "@/shared/utils/format";
import { ParticipationStatusBadge } from "@/components/ui/ParticipationStatusBadge";

type PanelFilter = ParticipationRequestStatus | "PAID";

const PANEL_FILTERS: { value: PanelFilter; label: string }[] = [
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Recusadas" },
  { value: "PAID", label: "Pagos" },
];

/** Card individual de uma solicitação com dados de contato e ações. */
function RequestRow({
  request,
  acting,
  onReview,
}: {
  request: ParticipationRequest;
  acting: boolean;
  onReview: (id: string, decision: "APPROVE" | "REJECT") => void;
}) {
  const isPending = request.status === "PENDING";

  return (
    <Box className="lot-offer-card" p="md">
      <Group justify="space-between" align="flex-start" wrap="wrap" gap="md">
        <Stack gap={6} flex={1} miw={200}>
          <Group gap="sm" wrap="wrap">
            <Text fw={700} lineClamp={1}>
              {request.name}
            </Text>
            <ParticipationStatusBadge status={request.status} size="xs" />
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
        </Stack>

        {isPending ? (
          <Group gap="sm" wrap="nowrap">
            <Button
              radius="xl"
              size="xs"
              color="green"
              leftSection={<IconCheck size={16} />}
              loading={acting}
              onClick={() => onReview(request.id, "APPROVE")}
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
              onClick={() => onReview(request.id, "REJECT")}
            >
              Recusar
            </Button>
          </Group>
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
                {participant.ticketCount}{" "}
                {participant.ticketCount === 1 ? "ingresso" : "ingressos"}
              </Text>
            </Group>
            <Group gap={6} wrap="nowrap">
              <IconReceipt size={15} />
              <Text size="sm" fw={600} c="brand">
                {formatCurrencyFromCents(participant.totalPriceCents)}
              </Text>
            </Group>
          </Group>
          <Text size="xs" c="dimmed">
            Pago em {formatEventDate(participant.paidAt)}
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
 */
export function ProducerParticipationPanel({
  eventId,
  onReviewComplete,
}: {
  eventId: string;
  onReviewComplete?: () => void;
}) {
  const [panelFilter, setPanelFilter] = useState<PanelFilter>("PENDING");
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [paidParticipants, setPaidParticipants] = useState<PaidParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [refundTarget, setRefundTarget] = useState<PaidParticipant | null>(null);
  const [refundLoading, setRefundLoading] = useState(false);

  const load = useCallback(
    async (filter: PanelFilter) => {
      setLoading(true);
      try {
        if (filter === "PAID") {
          const data = await participationService.listPaidParticipants(eventId);
          setPaidParticipants(data);
          setRequests([]);
        } else {
          const data = await participationService.listParticipationRequests(
            eventId,
            filter,
          );
          setRequests(data);
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

  const handleReview = async (id: string, decision: "APPROVE" | "REJECT") => {
    setActingId(id);
    try {
      await participationService.reviewParticipationRequest(eventId, id, decision);
      setRequests((current) => current.filter((request) => request.id !== id));
      notifications.show({
        title: decision === "APPROVE" ? "Solicitação aprovada" : "Solicitação recusada",
        message:
          decision === "APPROVE"
            ? "O participante já pode comprar o ingresso."
            : "A solicitação foi recusada.",
        color: decision === "APPROVE" ? "green" : "orange",
        icon: <IconCheck size={18} />,
      });

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

  const isPaidTab = panelFilter === "PAID";
  const isEmpty = isPaidTab ? paidParticipants.length === 0 : requests.length === 0;

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
                Aprove quem pediu para participar e acompanhe quem já pagou o ingresso.
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

        <SegmentedControl
          fullWidth
          radius="xl"
          value={panelFilter}
          onChange={(value) => setPanelFilter(value as PanelFilter)}
          data={PANEL_FILTERS}
        />

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : isEmpty ? (
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
        ) : isPaidTab ? (
          <Stack gap="sm">
            {paidParticipants.map((participant) => (
              <PaidRow
                key={participant.orderId}
                participant={participant}
                acting={actingId === participant.orderId}
                onRefundClick={setRefundTarget}
              />
            ))}
          </Stack>
        ) : (
          <Stack gap="sm">
            {requests.map((request) => (
              <RequestRow
                key={request.id}
                request={request}
                acting={actingId === request.id}
                onReview={(id, decision) => void handleReview(id, decision)}
              />
            ))}
          </Stack>
        )}
      </Stack>

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
