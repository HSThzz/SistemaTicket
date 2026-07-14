/**
 * @file Query: eventos acessíveis para check-in pelo ator.
 * @module modules/ticketing/application/queries/findCheckInAccessibleEvents
 */

import { Event } from "../../../../shared/infrastructure/persistence/entities/Event";
import { EventCheckInStaff } from "../../../../shared/infrastructure/persistence/entities/EventCheckInStaff";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { EventStatus } from "../../../../shared/kernel/enums";
import { isStaffRole } from "../../../../shared/kernel/staffRoles";
import { isEventDay } from "../helpers/eventDay";
import type { CheckInActor } from "../services/types";

const CHECK_IN_STATUSES = [EventStatus.PUBLISHED, EventStatus.FINISHED];

export interface CheckInAccessibleEvent {
  id: string;
  title: string;
  date: Date;
  location: string;
  status: EventStatus;
}

/**
 * Eventos em que o ator pode fazer check-in hoje (dono, equipe ou staff).
 */
export async function findCheckInAccessibleEvents(
  actor: CheckInActor,
): Promise<CheckInAccessibleEvent[]> {
  const eventRepo = AppDataSource.getRepository(Event);

  let candidates: Event[];

  if (isStaffRole(actor.role)) {
    candidates = await eventRepo
      .createQueryBuilder("event")
      .where("event.deletedAt IS NULL")
      .andWhere("event.status IN (:...statuses)", { statuses: CHECK_IN_STATUSES })
      .orderBy("event.date", "ASC")
      .getMany();
  } else {
    const owned = await eventRepo
      .createQueryBuilder("event")
      .where("event.deletedAt IS NULL")
      .andWhere("event.producerId = :userId", { userId: actor.userId })
      .andWhere("event.status IN (:...statuses)", { statuses: CHECK_IN_STATUSES })
      .getMany();

    const staffRows = await AppDataSource.getRepository(EventCheckInStaff)
      .createQueryBuilder("staff")
      .innerJoinAndSelect("staff.event", "event")
      .where("staff.userId = :userId", { userId: actor.userId })
      .andWhere("event.deletedAt IS NULL")
      .andWhere("event.status IN (:...statuses)", { statuses: CHECK_IN_STATUSES })
      .getMany();

    const byId = new Map<string, Event>();
    for (const event of owned) {
      byId.set(event.id, event);
    }
    for (const row of staffRows) {
      if (row.event) {
        byId.set(row.event.id, row.event);
      }
    }
    candidates = Array.from(byId.values()).sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }

  return candidates
    .filter((event) => isEventDay(event.date))
    .map((event) => ({
      id: event.id,
      title: event.title,
      date: event.date,
      location: event.location,
      status: event.status,
    }));
}
