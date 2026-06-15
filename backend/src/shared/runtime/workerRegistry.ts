/**
 * @file Registro em memória dos workers de reserva (persistência e expiração).
 * @module shared/runtime/workerRegistry
 */

import type { ReservationExpiryWorker } from "../../modules/sales/infrastructure/workers/ReservationExpiryWorker";
import type { ReservationPersistenceWorker } from "../../modules/sales/infrastructure/workers/ReservationPersistenceWorker";
import type { StockReconciliationWorker } from "../../modules/sales/infrastructure/workers/StockReconciliationWorker";
import type { PaymentProcessingWorker } from "../../modules/payment/infrastructure/workers/PaymentProcessingWorker";

let persistenceWorker: ReservationPersistenceWorker | null = null;
let expiryWorker: ReservationExpiryWorker | null = null;
let stockReconciliationWorker: StockReconciliationWorker | null = null;
let paymentProcessingWorker: PaymentProcessingWorker | null = null;

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
 * Retorna o worker de persistência registrado, se existir.
 * @returns Worker de persistência ou `null` quando não registrado.
 */
export function getReservationPersistenceWorker():
  | ReservationPersistenceWorker
  | null {
  return persistenceWorker;
}

/**
 * Registra ou remove a instância do worker de expiração por TTL Redis.
 * @param worker - Instância do worker ou `null` para limpar o registro.
 */
export function setReservationExpiryWorker(
  worker: ReservationExpiryWorker | null,
): void {
  expiryWorker = worker;
}

/**
 * Retorna o worker de expiração registrado, se existir.
 * @returns Worker de expiração ou `null` quando não registrado.
 */
export function getReservationExpiryWorker(): ReservationExpiryWorker | null {
  return expiryWorker;
}

/**
 * Registra ou remove a instância do worker de reconciliação de estoque.
 * @param worker - Instância do worker ou `null` para limpar o registro.
 */
export function setStockReconciliationWorker(
  worker: StockReconciliationWorker | null,
): void {
  stockReconciliationWorker = worker;
}

/**
 * Retorna o worker de reconciliação de estoque registrado, se existir.
 * @returns Worker de reconciliação ou `null` quando não registrado.
 */
export function getStockReconciliationWorker(): StockReconciliationWorker | null {
  return stockReconciliationWorker;
}

/**
 * Registra ou remove a instância do worker de processamento de pagamentos.
 */
export function setPaymentProcessingWorker(
  worker: PaymentProcessingWorker | null,
): void {
  paymentProcessingWorker = worker;
}

/**
 * Retorna o worker de processamento de pagamentos registrado, se existir.
 */
export function getPaymentProcessingWorker(): PaymentProcessingWorker | null {
  return paymentProcessingWorker;
}
