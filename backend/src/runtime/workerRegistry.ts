import type { ReservationPersistenceWorker } from "../workers/ReservationPersistenceWorker";

let persistenceWorker: ReservationPersistenceWorker | null = null;

export function setReservationPersistenceWorker(
  worker: ReservationPersistenceWorker | null,
): void {
  persistenceWorker = worker;
}

export function getReservationPersistenceWorker():
  | ReservationPersistenceWorker
  | null {
  return persistenceWorker;
}

