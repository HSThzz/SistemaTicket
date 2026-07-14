/**
 * @file Serviço: adiciona membro à equipe de portaria por e-mail.
 * @module modules/catalog/application/services/addCheckInStaff
 */

import { isUniqueViolation } from "../../../../shared/infrastructure/persistence/isUniqueViolation";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { findOneUserByEmail } from "../../../identity/application/queries/findOneUserByEmail";
import {
  CheckInStaffAlreadyExistsError,
  CheckInStaffIsEventOwnerError,
  CheckInStaffUserNotFoundError,
  EventNotFoundError,
} from "../../domain/errors/EventError";
import {
  addCheckInStaffSchema,
  type AddCheckInStaffInputSchema,
} from "../../validators/schema/addCheckInStaffSchema";
import { eventIdSchema } from "../../validators/schema/eventIdSchema";
import { createCheckInStaffMember } from "../commands/createCheckInStaffMember";
import { assertCanManageEvent } from "../helpers/assertCanManageEvent";
import { findCheckInStaffMember } from "../queries/findCheckInStaffMember";
import { findOneEventById } from "../queries/findOneEventById";
import type { EventActor } from "../types";
import type { CheckInStaffListItem } from "./listCheckInStaff";

export async function addCheckInStaff(
  eventId: string,
  input: AddCheckInStaffInputSchema,
  actor: EventActor,
): Promise<CheckInStaffListItem> {
  const id = validateSchema(eventIdSchema, eventId);
  const data = validateSchema(addCheckInStaffSchema, input);

  const event = await findOneEventById(id);
  if (!event) {
    throw new EventNotFoundError(id);
  }

  assertCanManageEvent(event, actor);

  const user = await findOneUserByEmail(data.email.trim().toLowerCase());
  if (!user) {
    throw new CheckInStaffUserNotFoundError();
  }

  if (event.producerId === user.id) {
    throw new CheckInStaffIsEventOwnerError();
  }

  const existing = await findCheckInStaffMember(id, user.id);
  if (existing) {
    throw new CheckInStaffAlreadyExistsError();
  }

  try {
    const saved = await createCheckInStaffMember({
      eventId: id,
      userId: user.id,
      addedByUserId: actor.userId,
    });

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      createdAt: saved.createdAt.toISOString(),
    };
  } catch (error) {
    if (isUniqueViolation(error)) {
      throw new CheckInStaffAlreadyExistsError();
    }
    throw error;
  }
}
