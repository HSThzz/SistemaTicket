/**
 * K6 — stress test do fluxo crítico: login + reserva de ingressos
 *
 * Variáveis de ambiente:
 *   BASE_URL          — URL da API (ex: http://app-api:3000)
 *   TEST_EMAIL        — e-mail do usuário de teste
 *   TEST_PASSWORD     — senha do usuário de teste
 *   TICKET_LOT_ID     — UUID do lote a reservar
 *   RESERVE_QUANTITY  — quantidade por requisição (padrão: 1)
 *
 * Execução: ver STRESS_TEST_README.md
 */

import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:3000";
const TEST_EMAIL = __ENV.TEST_EMAIL;
const TEST_PASSWORD = __ENV.TEST_PASSWORD;
const TICKET_LOT_ID = __ENV.TICKET_LOT_ID;
const RESERVE_QUANTITY = Number(__ENV.RESERVE_QUANTITY || "1");

export const options = {
  scenarios: {
    reservation_spike: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: 200 },
        { duration: "10s", target: 200 },
      ],
      gracefulRampDown: "5s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.50"],
    // Medir p95 por endpoint (o p95 global mistura tudo).
    "http_req_duration{endpoint:reserve}": ["p(95)<1500"],
    "http_req_duration{endpoint:login}": ["p(95)<2000"],
    "checks{endpoint:reserve}": ["rate>0.01"],
  },
};

export function setup() {
  const missing = [];

  if (!TEST_EMAIL) missing.push("TEST_EMAIL");
  if (!TEST_PASSWORD) missing.push("TEST_PASSWORD");
  if (!TICKET_LOT_ID) missing.push("TICKET_LOT_ID");

  if (missing.length > 0) {
    throw new Error(
      `Variáveis obrigatórias ausentes: ${missing.join(", ")}. Consulte STRESS_TEST_README.md`,
    );
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
    {
      headers: { "Content-Type": "application/json" },
      tags: { endpoint: "login" },
    },
  );

  if (loginRes.status !== 200) {
    throw new Error(
      `Setup falhou: login retornou HTTP ${loginRes.status}. Verifique usuário de teste e BASE_URL (${BASE_URL}). Body: ${loginRes.body}`,
    );
  }

  console.log(`Setup OK — API acessível em ${BASE_URL}, usuário ${TEST_EMAIL} autenticado.`);

  return { token: loginRes.json("token") };
}

export default function (data) {
  const token = data.token;
  const reserveRes = http.post(
    `${BASE_URL}/purchases/reserve`,
    JSON.stringify({
      ticketLotId: TICKET_LOT_ID,
      quantity: RESERVE_QUANTITY,
    }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      tags: { endpoint: "reserve" },
    },
  );

  check(reserveRes, {
    "reserve status 201": (response) => response.status === 201,
    "reserve status 409 (estoque esgotado)": (response) => response.status === 409,
    "reserve status 400 (lock/validação)": (response) => response.status === 400,
  });

  sleep(0.05);
}

export function handleSummary(data) {
  const lines = [
    "========== Stress Test — Resumo ==========",
    `URL: ${BASE_URL}`,
    `VUs máximos: 200 | Ramp-up: 20s | Pico: 10s`,
    `Requisições HTTP: ${data.metrics.http_reqs?.values?.count ?? "n/a"}`,
    `Taxa de falha HTTP: ${((data.metrics.http_req_failed?.values?.rate ?? 0) * 100).toFixed(2)}%`,
    `Latência p95: ${(data.metrics.http_req_duration?.values?.["p(95)"] ?? 0).toFixed(2)} ms`,
    "==========================================",
  ];

  return {
    stdout: lines.join("\n") + "\n",
  };
}
