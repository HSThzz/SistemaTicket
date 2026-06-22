import type { ReservationPhase } from "../types/api";
import { PremiumBadge, type PremiumBadgeTone } from "./ui/PremiumBadge";

const PHASE_LABELS: Record<ReservationPhase, string> = {
  PENDING_PERSISTENCE: "Processando reserva",
  PENDING_PAYMENT: "Aguardando pagamento",
  AWAITING_PAYMENT: "Aguardando pagamento",
  PAID: "Pago",
  EXPIRED: "Expirado",
  FAILED: "Falhou",
  NOT_FOUND: "Não encontrado",
};

/** Mapeia fase da reserva para tom visual do badge. */
function getPhaseTone(phase: ReservationPhase): PremiumBadgeTone {
  switch (phase) {
    case "PENDING_PERSISTENCE":
    case "PENDING_PAYMENT":
      return "finished";
    case "AWAITING_PAYMENT":
      return "warning";
    case "PAID":
      return "published";
    case "EXPIRED":
    case "NOT_FOUND":
      return "neutral";
    case "FAILED":
      return "cancelled";
    default:
      return "neutral";
  }
}

interface PhaseBadgeProps {
  phase: ReservationPhase;
}

export function PhaseBadge({ phase }: PhaseBadgeProps) {
  const isPaid = phase === "PAID";

  return (
    <PremiumBadge tone={getPhaseTone(phase)} size="md" dot={isPaid} pulseDot={isPaid}>
      {PHASE_LABELS[phase]}
    </PremiumBadge>
  );
}

export function getPhaseLabel(phase: ReservationPhase): string {
  return PHASE_LABELS[phase];
}
