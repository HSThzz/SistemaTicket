/**
 * K6 — carga no webhook de pagamento (payment.succeeded)
 *
 * Pré-requisito: pedidos PENDING já existentes no banco.
 * Passe IDs separados por vírgula em ORDER_IDS ou deixe o setup criar alguns.
 *
 *   ORDER_IDS=uuid1,uuid2,uuid3
 *   SETUP_ORDERS_COUNT=20 (opcional, cria via API no setup)
 */

import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;
const TICKET_LOT_ID = __ENV.TICKET_LOT_ID;
const ORDER_IDS_RAW = __ENV.ORDER_IDS || "";
const SETUP_ORDERS_COUNT = Number(__ENV.SETUP_ORDERS_COUNT || "0");

export const options = {
  scenarios: {
    webhook_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: 100 },
        { duration: "15s", target: 100 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.20"],
    "http_req_duration{endpoint:webhook}": ["p(95)<3000"],
    "checks{endpoint:webhook}": ["rate>0.80"],
  },
};

function login() {
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "login" } },
  );
  if (res.status !== 200) return null;
  return res.json("token");
}

function reserveAndWaitForOrder(token) {
  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const reserveRes = http.post(
    `${BASE_URL}/purchases/reserve`,
    JSON.stringify({ ticketLotId: TICKET_LOT_ID, quantity: 1 }),
    { headers, tags: { endpoint: "reserve" } },
  );

  if (reserveRes.status !== 201) return null;

  const reservationId = reserveRes.json("reservation.id");

  for (let i = 0; i < 40; i += 1) {
    const pollRes = http.get(
      `${BASE_URL}/purchases/reservations/${reservationId}`,
      { headers, tags: { endpoint: "poll" } },
    );

    if (pollRes.status === 200) {
      const body = pollRes.json();
      if (body.order?.id && body.payment) {
        return {
          orderId: body.order.id,
          transactionId: body.payment.transactionId,
        };
      }
    }
  }

  return null;
}

export function setup() {
  const fromEnv = ORDER_IDS_RAW.split(",").map((s) => s.trim()).filter(Boolean);
  if (fromEnv.length > 0) {
    return {
      orders: fromEnv.map((orderId) => ({
        orderId,
        transactionId: `pix_sim_${orderId.slice(0, 8)}`,
      })),
    };
  }

  if (!TEST_EMAIL || !TEST_PASSWORD || !TICKET_LOT_ID || SETUP_ORDERS_COUNT <= 0) {
    throw new Error(
      "Informe ORDER_IDS ou configure TEST_EMAIL, TEST_PASSWORD, TICKET_LOT_ID e SETUP_ORDERS_COUNT>0",
    );
  }

  const token = login();
  if (!token) throw new Error("Setup: login falhou");

  const orders = [];
  for (let i = 0; i < SETUP_ORDERS_COUNT; i += 1) {
    const created = reserveAndWaitForOrder(token);
    if (created) orders.push(created);
  }

  if (orders.length === 0) {
    throw new Error("Setup: nenhum pedido pronto para webhook");
  }

  console.log(`Setup: ${orders.length} pedidos prontos para webhook`);
  return { orders };
}

export default function (data) {
  const list = data.orders;
  if (!list || list.length === 0) return;

  const pick = list[Math.floor(Math.random() * list.length)];

  const res = http.post(
    `${BASE_URL}/payments/webhook`,
    JSON.stringify({
      event: "payment.succeeded",
      data: {
        orderId: pick.orderId,
        transactionId: pick.transactionId,
        paidAt: new Date().toISOString(),
      },
    }),
    { headers: { "Content-Type": "application/json" }, tags: { endpoint: "webhook" } },
  );

  check(res, {
    "webhook accepted": (r) => r.status === 200,
  });
}
