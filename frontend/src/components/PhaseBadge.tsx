import { Badge, type BadgeProps } from "@mantine/core";
import type { ReservationPhase } from "../types/api";

const PHASE_LABELS: Record<ReservationPhase, string> = {
  PENDING_PERSISTENCE: "Processando reserva",
  PENDING_PAYMENT: "Aguardando pagamento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  EXPIRED: "Expirado",
  FAILED: "Falhou",
  NOT_FOUND: "Não encontrado",
};

const PHASE_COLORS: Record<ReservationPhase, BadgeProps["color"]> = {
  PENDING_PERSISTENCE: "blue",
  PENDING_PAYMENT: "blue",
  AWAITING_PAYMENT: "yellow",
  PAID: "green",
  EXPIRED: "gray",
  FAILED: "red",
  NOT_FOUND: "gray",
};

interface PhaseBadgeProps {
  phase: ReservationPhase;
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  return (
    <Badge color={PHASE_COLORS[phase]} variant="light" size="lg" radius="sm">
      {PHASE_LABELS[phase]}
    </Badge>
  );
}

export function getPhaseLabel(phase: ReservationPhase): string {
  return PHASE_LABELS[phase];
}
