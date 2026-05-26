/**
 * K6 — fluxo E2E: reserva → polling de status/PIX → webhook de pagamento
 *
 * Variáveis:
 *   BASE_URL, TEST_EMAIL, TEST_PASSWORD, TICKET_LOT_ID, RESERVE_QUANTITY
 *   POLL_MAX_ATTEMPTS (default 30)
 *   POLL_INTERVAL_MS (default 200) — só sleep no default, k6 usa segundos
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;
const TICKET_LOT_ID = __ENV.TICKET_LOT_ID;
const RESERVE_QUANTITY = Number(__ENV.RESERVE_QUANTITY || "1");
const POLL_MAX_ATTEMPTS = Number(__ENV.POLL_MAX_ATTEMPTS || "30");
const POLL_INTERVAL_SEC = Number(__ENV.POLL_INTERVAL_SEC || "0.2");

export const options = {
  scenarios: {
    full_flow_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 50 },
        { duration: "10s", target: 50 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.30"],
    "http_req_duration{endpoint:reserve}": ["p(95)<2000"],
    "http_req_duration{endpoint:poll}": ["p(95)<1000"],
    "http_req_duration{endpoint:webhook}": ["p(95)<3000"],
    "checks{step:payment_ready}": ["rate>0.50"],
  },
};

export function setup() {
  const missing = [];
  if (!TEST_EMAIL) missing.push("TEST_EMAIL");
  if (!TEST_PASSWORD) missing.push("TEST_PASSWORD");
  if (!TICKET_LOT_ID) missing.push("TICKET_LOT_ID");
  if (missing.length) {
    throw new Error(`Variáveis ausentes: ${missing.join(", ")}`);
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } },
  );

  if (loginRes.status !== 200) {
    throw new Error(`Setup login falhou: HTTP ${loginRes.status}`);
  }

  return { token: loginRes.json("token") };
}

export default function (data) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${data.token}`,
  };

  const reserveRes = http.post(
    `${BASE_URL}/purchases/reserve`,
    JSON.stringify({ ticketLotId: TICKET_LOT_ID, quantity: RESERVE_QUANTITY }),
    { headers, tags: { endpoint: "reserve" } },
  );

  const reserved = check(reserveRes, {
    "reserve 201": (r) => r.status === 201,
  });

  if (!reserved) {
    return;
  }

  const reservationId = reserveRes.json("reservation.id");
  let orderId = null;
  let transactionId = null;
  let paymentReady = false;

  for (let attempt = 0; attempt < POLL_MAX_ATTEMPTS; attempt += 1) {
    const pollRes = http.get(
      `${BASE_URL}/purchases/reservations/${reservationId}`,
      { headers, tags: { endpoint: "poll" } },
    );

    if (pollRes.status === 200) {
      const body = pollRes.json();
      const phase = body.phase;
      orderId = body.order?.id ?? orderId;
      transactionId = body.payment?.transactionId ?? transactionId;

      if (phase === "AWAITING_PAYMENT" || phase === "PAID") {
        paymentReady = Boolean(body.payment?.pixCopyPaste);
        break;
      }
    }

    sleep(POLL_INTERVAL_SEC);
  }

  check(null, {
    "payment ready": () => paymentReady,
  });

  if (!paymentReady || !orderId) {
    return;
  }

  const webhookRes = http.post(
    `${BASE_URL}/payments/webhook`,
    JSON.stringify({
      event: "payment.succeeded",
      data: {
        transactionId: transactionId || `pix_sim_k6_${reservationId}`,
        orderId,
        paidAt: new Date().toISOString(),
      },
    }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "webhook" } },
  );

  check(webhookRes, {
    "webhook 200": (r) => r.status === 200,
  });
}
