import type { UserRole } from "../../../../shared/kernel/enums";

export interface CheckInActor {
  userId: string;
  role: UserRole;
}

export interface CheckInPreviewResult {
  ownerName: string;
  ownerDocument: string;
  ticketId: string;
  eventTitle: string;
  lotName: string;
  /** Preço do lote em centavos (0 = gratuito). */
  lotPrice: number;
}

export interface CheckInResult extends CheckInPreviewResult {
  checkedInAt: string;
}
