import type { EventStatus } from "../types/api";
import { getEventStatusLabel } from "./statusLabels";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Rascunho" },
  { value: "PUBLISHED", label: "Publicado" },
  { value: "CANCELLED", label: "Cancelado" },
  { value: "FINISHED", label: "Encerrado" },
] as const;

const ALLOWED_TRANSITIONS: Record<EventStatus, ReadonlySet<EventStatus>> = {
  DRAFT: new Set(["DRAFT", "PUBLISHED", "CANCELLED"]),
  PUBLISHED: new Set(["PUBLISHED", "CANCELLED", "FINISHED"]),
  CANCELLED: new Set(["CANCELLED"]),
  FINISHED: new Set(["FINISHED"]),
};

export function getAllowedEventStatusOptions(currentStatus: EventStatus) {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] ?? new Set([currentStatus]);

  return STATUS_OPTIONS.filter((option) => allowed.has(option.value));
}

export function isTerminalEventStatus(status: EventStatus): boolean {
  return status === "CANCELLED" || status === "FINISHED";
}

export function getEventStatusTransitionHint(currentStatus: EventStatus): string | null {
  if (currentStatus === "CANCELLED") {
    return "Eventos cancelados não podem ser republicados. Crie um novo evento se precisar de outra data.";
  }

  if (currentStatus === "FINISHED") {
    return "Eventos encerrados ficam apenas para consulta do histórico.";
  }

  if (currentStatus === "PUBLISHED") {
    return "Você pode cancelar ou encerrar o evento, mas não voltar para rascunho.";
  }

  return null;
}

export function canPublishEvent(status: EventStatus): boolean {
  return status === "DRAFT";
}

export function requiresEventStatusConfirmation(
  from: EventStatus,
  to: EventStatus,
): boolean {
  return from !== to && (to === "CANCELLED" || to === "FINISHED");
}

export function getEventStatusConfirmationCopy(to: EventStatus): {
  title: string;
  message: string;
  confirmLabel: string;
  color: string;
} | null {
  if (to === "CANCELLED") {
    return {
      title: "Cancelar evento?",
      message:
        "O evento sairá da vitrine e não poderá ser republicado. Se já houver ingressos vendidos, avalie reembolsos e comunicação com o público antes de confirmar.",
      confirmLabel: "Sim, cancelar evento",
      color: "red",
    };
  }

  if (to === "FINISHED") {
    return {
      title: "Encerrar evento?",
      message:
        "O evento ficará apenas no histórico como realizado e não voltará a ficar publicado na vitrine.",
      confirmLabel: "Sim, encerrar evento",
      color: "gray",
    };
  }

  return null;
}

export function formatInvalidStatusTransition(from: EventStatus, to: EventStatus): string {
  return `Não é possível alterar de ${getEventStatusLabel(from)} para ${getEventStatusLabel(to)}.`;
}

export function canDeleteEventFromList(status: EventStatus): boolean {
  return status === "CANCELLED" || status === "FINISHED";
}

export function getEventDeleteConfirmationCopy(status: EventStatus): {
  title: string;
  message: string;
  confirmLabel: string;
  color: string;
} {
  const baseMessage =
    "O evento sairá da sua lista. Ingressos vendidos e histórico de vendas permanecem no sistema.";

  if (status === "CANCELLED") {
    return {
      title: "Remover evento cancelado?",
      message: baseMessage,
      confirmLabel: "Sim, remover da lista",
      color: "red",
    };
  }

  return {
    title: "Remover evento encerrado?",
    message: baseMessage,
    confirmLabel: "Sim, remover da lista",
    color: "gray",
  };
}
