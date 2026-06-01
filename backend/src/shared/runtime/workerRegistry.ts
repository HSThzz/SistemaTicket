/**
 * @file Registro em memória do worker de persistência de reservas.
 * @module shared/runtime/workerRegistry
 */

import type { ReservationPersistenceWorker } from "../../modules/sales/infrastructure/workers/ReservationPersistenceWorker";

let persistenceWorker: ReservationPersistenceWorker | null = null;

/**
 * Registra ou remove a instância do worker de persistência (usado no health check).
 * @param worker - Instância do worker ou `null` para limpar o registro.
 */
export function setReservationPersistenceWorker(
  worker: ReservationPersistenceWorker | null,
): void {
  persistenceWorker = worker;
}

/**
 * Retorna o worker registrado, se existir.
 * @returns Worker de persistência ou `null` quando não registrado.
 */
export function getReservationPersistenceWorker():
  | ReservationPersistenceWorker
  | null {
  return persistenceWorker;
}
