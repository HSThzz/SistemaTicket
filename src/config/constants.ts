export const RESERVATION_TTL_SECONDS = 15 * 60;
export const RESERVATION_TTL_MS = RESERVATION_TTL_SECONDS * 1000;

export const RESERVATION_KEY_PREFIX = "reservation:";

// Estoque é a fonte de verdade em Redis durante o pico.
export const TICKET_LOT_STOCK_KEY_PREFIX = "stock:ticket-lot:";

// Fila simples (Redis LIST) para persistência assíncrona.
export const RESERVATION_PERSIST_QUEUE_KEY = "queue:reservation:persist";

// Retry/DLQ para jobs que falham ao persistir.
export const RESERVATION_PERSIST_RETRY_QUEUE_KEY =
  "queue:reservation:persist:retry";
export const RESERVATION_PERSIST_DLQ_KEY = "queue:reservation:persist:dlq";

// ZSET para agendar retries com backoff (score = timestamp ms)
export const RESERVATION_PERSIST_RETRY_SCHEDULE_KEY =
  "queue:reservation:persist:retry:schedule";

// Cache de pagamento PIX gerado após persistência do pedido.
export const PAYMENT_CACHE_KEY_PREFIX = "payment:reservation:";
export const ORDER_CACHE_KEY_PREFIX = "order:reservation:";
