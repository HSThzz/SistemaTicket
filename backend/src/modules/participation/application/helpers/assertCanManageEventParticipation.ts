/**
 * @file Autorização: garante que o ator pode gerenciar solicitações do evento.
 * @module modules/participation/application/helpers/assertCanManageEventParticipation
 */

import type { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import { ParticipationAccessDeniedError } from "../../domain/errors/ParticipationError";
import type { ParticipationActor } from "../types";

/**
 * Permite equipe (ADMIN/SUPER_ADMIN) ou o produtor dono do evento.
 * @throws {ParticipationAccessDeniedError} Quando o ator não é dono nem equipe.
 */
export function assertCanManageEventParticipation(
  event: Event,
  actor: ParticipationActor,
): void {
  if (isStaffRole(actor.role)) {
    return;
  }

  if (event.producerId !== actor.userId) {
    throw new ParticipationAccessDeniedError();
  }
}
