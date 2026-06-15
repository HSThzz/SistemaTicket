/**
 * @file Constantes de chaves Redis e TTLs compartilhados entre módulos.
 * @module shared/infrastructure/config/constants
 */

/** TTL padrão de reserva em segundos (15 minutos). */
export const RESERVATION_TTL_SECONDS = 15 * 60;

/** TTL padrão de reserva em milissegundos. */
export const RESERVATION_TTL_MS = RESERVATION_TTL_SECONDS * 1000;

/** Prefixo das chaves de reserva temporária no Redis. */
export const RESERVATION_KEY_PREFIX = "reservation:";

/** Prefixo das chaves de estoque de lote no Redis (fonte de verdade no pico). */
export const TICKET_LOT_STOCK_KEY_PREFIX = "stock:ticket-lot:";

/** Chave da fila LIST de persistência assíncrona de reservas. */
export const RESERVATION_PERSIST_QUEUE_KEY = "queue:reservation:persist";

/** Chave da fila LIST de retry para jobs que falham ao persistir. */
export const RESERVATION_PERSIST_RETRY_QUEUE_KEY =
  "queue:reservation:persist:retry";

/** Chave da fila LIST de dead-letter (DLQ) de persistência. */
export const RESERVATION_PERSIST_DLQ_KEY = "queue:reservation:persist:dlq";

/** Chave do ZSET de agendamento de retries (score = timestamp em ms). */
export const RESERVATION_PERSIST_RETRY_SCHEDULE_KEY =
  "queue:reservation:persist:retry:schedule";

/** Prefixo do cache de pagamento PIX por reserva. */
export const PAYMENT_CACHE_KEY_PREFIX = "payment:reservation:";

/** Prefixo do cache de pedido por reserva. */
export const ORDER_CACHE_KEY_PREFIX = "order:reservation:";

/** Prefixo de lock distribuído para inicialização de estoque de lote. */
export const LOCK_STOCK_INIT_KEY_PREFIX = "lock:stock:init:";

/** Prefixo de lock distribuído para cobrança de pedido (cartão/PIX). */
export const LOCK_ORDER_PAYMENT_KEY_PREFIX = "lock:order:payment:";
