import type { UserRole } from "../../../../shared/kernel/enums";

export interface CheckInActor {
  userId: string;
  role: UserRole;
}

export interface CheckInResult {
  ownerName: string;
  ownerDocument: string;
  checkedInAt: string;
  ticketId: string;
  eventTitle: string;
}
