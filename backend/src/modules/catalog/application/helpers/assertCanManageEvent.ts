import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { UserRole } from "../../../../shared/kernel/enums";
import { EventAccessDeniedError } from "../../domain/errors/EventError";
import type { EventActor } from "../types";

export function assertCanManageEvent(event: Event, actor: EventActor): void {
  if (actor.role === UserRole.ADMIN) {
    return;
  }

  if (event.producerId !== actor.userId) {
    throw new EventAccessDeniedError();
  }
}
