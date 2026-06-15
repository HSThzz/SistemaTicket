import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import { EventAccessDeniedError } from "../../domain/errors/EventError";
import type { EventActor } from "../types";

export function assertCanManageEvent(event: Event, actor: EventActor): void {
  if (isStaffRole(actor.role)) {
    return;
  }

  if (event.producerId !== actor.userId) {
    throw new EventAccessDeniedError();
  }
}
