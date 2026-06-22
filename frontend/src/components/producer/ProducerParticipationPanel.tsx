/**
 * @file Painel do produtor para aprovar/recusar solicitações de participação.
 * @module components/producer/ProducerParticipationPanel
 */

import { useCallback, useEffect, useState } from "react";
import {
  ActionIcon,
  Badge,
  Box,
  Button,
  Group,
  Loader,
  SegmentedControl,
  Stack,
  Text,
  ThemeIcon,
  Title,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  IconCheck,
  IconMail,
  IconPhone,
  IconRefresh,
  IconUserCheck,
  IconUsers,
  IconX,
} from "@tabler/icons-react";
import { EmptyState } from "../account/EmptyState";
import { PremiumPaper } from "../account/PremiumPaper";
import * as participationService from "../../features/participation/api/participationService";
import type {
  ParticipationRequest,
  ParticipationRequestStatus,
} from "../../types/api";
import { getApiErrorMessage } from "../../utils/errors";
import { formatEventDate } from "../../utils/format";
import {
  getParticipationStatusColor,
  getParticipationStatusLabel,
} from "../../utils/statusLabels";

const STATUS_FILTERS: { value: ParticipationRequestStatus; label: string }[] = [
  { value: "PENDING", label: "Pendentes" },
  { value: "APPROVED", label: "Aprovadas" },
  { value: "REJECTED", label: "Recusadas" },
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
            <Badge
              variant="light"
              color={getParticipationStatusColor(request.status)}
              radius="sm"
              size="sm"
            >
              {getParticipationStatusLabel(request.status)}
            </Badge>
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
  const [statusFilter, setStatusFilter] =
    useState<ParticipationRequestStatus>("PENDING");
  const [requests, setRequests] = useState<ParticipationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(
    async (status: ParticipationRequestStatus) => {
      setLoading(true);
      try {
        const data = await participationService.listParticipationRequests(
          eventId,
          status,
        );
        setRequests(data);
      } catch (err) {
        notifications.show({
          title: "Erro ao carregar solicitações",
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
    void load(statusFilter);
  }, [load, statusFilter]);

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
                Aprove ou recuse quem pediu para participar deste evento privado.
              </Text>
            </Stack>
          </Group>
          <Tooltip label="Atualizar">
            <ActionIcon
              variant="light"
              radius="xl"
              size="lg"
              onClick={() => void load(statusFilter)}
              aria-label="Atualizar solicitações"
            >
              <IconRefresh size={18} />
            </ActionIcon>
          </Tooltip>
        </Group>

        <SegmentedControl
          fullWidth
          radius="xl"
          value={statusFilter}
          onChange={(value) =>
            setStatusFilter(value as ParticipationRequestStatus)
          }
          data={STATUS_FILTERS}
        />

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="sm" color="brand" />
          </Group>
        ) : requests.length === 0 ? (
          <EmptyState
            icon={<IconUsers size={32} />}
            title="Nenhuma solicitação"
            description={
              statusFilter === "PENDING"
                ? "Quando alguém solicitar participação, aparecerá aqui para sua aprovação."
                : "Nenhuma solicitação neste status por enquanto."
            }
          />
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
    </PremiumPaper>
  );
}
