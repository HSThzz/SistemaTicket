# API de Ingressos — Express + TypeORM + Redis

API backend para venda de ingressos com **reserva atômica no Redis**, persistência assíncrona no PostgreSQL, pagamento PIX (simulado) e emissão de tickets com suporte a Apple/Google Wallet.

## Stack

- **Node.js 20+**, **Express 5**, **TypeScript**
- **PostgreSQL** + **TypeORM** (migrations)
- **Redis** (estoque, cache, filas, rate limit, TTL de reservas)
- **JWT** para autenticação
- Workers em processo: persistência de reservas + expiração

## Arquitetura (fluxo de compra)

```mermaid
sequenceDiagram
  participant C as Cliente
  participant API as API
  participant R as Redis
  participant W as PersistenceWorker
  participant PG as PostgreSQL
  participant GW as Gateway PIX

  C->>API: POST /purchases/reserve
  API->>R: Lua (decrementa estoque + reserva + enfileira)
  API-->>C: 201 reservationId + pollUrl

  W->>R: BRPOP fila persist
  W->>PG: reservation + order
  W->>GW: createPixCharge
  W->>R: cache payment

  C->>API: GET /purchases/reservations/:id (poll)
  API-->>C: AWAITING_PAYMENT + pixCopyPaste

  GW->>API: POST /payments/webhook
  API->>PG: order PAID + tickets
```

## Início rápido

### Docker (recomendado)

```bash
docker compose up -d --build
docker compose run --rm migrate
```

API disponível em `http://localhost:3000`.

### Local (dev)

```bash
cp .env.example .env
npm install
npm run migration:run
npm run dev
```

## Variáveis de ambiente

Copie `.env.example` para `.env`. Principais variáveis:

| Variável | Descrição |
|----------|-----------|
| `PORT` | Porta da API (padrão `3000`) |
| `JWT_SECRET` | Segredo do JWT |
| `PAYMENT_WEBHOOK_SECRET` | Header `x-webhook-secret` do webhook |
| `DB_*` | Conexão PostgreSQL |
| `REDIS_*` | Conexão Redis |
| `APPLE_*` / `GOOGLE_WALLET_*` | Credenciais Wallet (opcional) |

> Em produção, **`PAYMENT_WEBHOOK_SECRET` é obrigatório** — sem ele o webhook retorna 401.

## Roles

| Role | Permissões |
|------|------------|
| `CLIENT` | Comprar, ver pedidos/ingressos, wallet dos próprios tickets |
| `PRODUCER` | Gerenciar **seus** eventos/lotes, check-in nos seus eventos, ops |
| `ADMIN` | Tudo (qualquer evento, promover usuários, ops) |

Cadastro público sempre cria usuário como `CLIENT`. Promoção via `PATCH /auth/users/:userId/role` (ADMIN).

---

## Health check

### `GET /health`

Verifica dependências críticas e estado operacional.

**Resposta (200 = ok/degraded, 503 = down):**

```json
{
  "status": "ok",
  "timestamp": "2026-05-26T21:00:00.000Z",
  "components": {
    "postgres": { "status": "ok", "latencyMs": 3 },
    "redis": { "status": "ok", "latencyMs": 1 },
    "worker": {
      "status": "ok",
      "running": true,
      "metrics": {
        "processedCount": 120,
        "failedCount": 2,
        "retryScheduledCount": 1,
        "dlqCount": 0
      }
    },
    "queues": {
      "status": "ok",
      "persistQueueLength": 0,
      "retryQueueLength": 0,
      "dlqLength": 0,
      "retryScheduled": 0,
      "alerts": []
    }
  }
}
```

- **`down`**: Postgres ou Redis indisponível → HTTP **503**
- **`degraded`**: worker parado, DLQ com jobs, retries atrasados ou backlog alto → HTTP **200** (com alertas)

---

## Autenticação

Envie JWT no header:

```
Authorization: Bearer <token>
```

### Endpoints

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/auth/register` | — | Cadastro (`CLIENT`) |
| POST | `/auth/login` | — | Login → JWT |
| PATCH | `/auth/users/:userId/role` | ADMIN | Promover role |

---

## Eventos e lotes

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/events` | — | Lista eventos `PUBLISHED` + lotes |
| GET | `/events/:eventId` | — | Detalhe evento publicado |
| GET | `/events/mine` | PRODUCER/ADMIN | Eventos gerenciáveis |
| POST | `/events` | PRODUCER/ADMIN | Cria evento (`DRAFT`) |
| PATCH | `/events/:eventId` | PRODUCER/ADMIN* | Atualiza evento/status |
| POST | `/events/:eventId/lots` | PRODUCER/ADMIN* | Cria lote |

\* PRODUCER só gerencia eventos onde `producer_id` = seu user id.

**Criar lote (exemplo):**
```json
{
  "name": "Pista",
  "price": 5000,
  "totalQuantity": 1000,
  "availableQuantity": 1000
}
```
`price` em centavos.

---

## Compras (fluxo crítico)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/purchases/reserve` | CLIENT+ | Reserva ingressos (Redis) |
| GET | `/purchases/reservations/:id` | CLIENT+ | Status da reserva (poll) |

**Reservar:**
```json
{ "ticketLotId": "<uuid>", "quantity": 2 }
```

**Fases do poll (`phase`):**
`PENDING_PERSISTENCE` → `PENDING_PAYMENT` → `AWAITING_PAYMENT` → `PAID` | `EXPIRED` | `FAILED`

TTL da reserva: **15 minutos**.

---

## Pagamentos

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/payments/webhook` | secret | Webhook do gateway |

**Header obrigatório (prod):**
```
x-webhook-secret: <PAYMENT_WEBHOOK_SECRET>
```

**Payload:**
```json
{
  "event": "payment.succeeded",
  "data": {
    "orderId": "<uuid>",
    "transactionId": "pix_...",
    "paidAt": "2026-05-26T21:00:00.000Z"
  }
}
```

Eventos: `payment.succeeded` | `payment.failed`

---

## Pedidos e ingressos (cliente)

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/orders/me` | CLIENT+ | Meus pedidos |
| GET | `/tickets/me` | CLIENT+ | Meus ingressos |

---

## Check-in

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| POST | `/tickets/check-in` | PRODUCER/ADMIN* | Valida ingresso na portaria |

```json
{ "unique_code": "<codigo-qr>" }
```

Regras: ticket `ACTIVE`, evento `PUBLISHED`, apenas no dia do evento (TZ `America/Sao_Paulo`).

\* PRODUCER só check-in em eventos próprios.

---

## Wallet

| Método | Rota | Auth | Descrição |
|--------|------|------|-----------|
| GET | `/wallet/apple/:ticketId` | CLIENT+* | Download `.pkpass` |
| GET | `/wallet/google/:ticketId` | CLIENT+* | Redirect Google Wallet |

\* Dono do ticket, PRODUCER do evento ou ADMIN.

---

## Operações (ops)

Requer JWT + `ADMIN` ou `PRODUCER`.

| Método | Rota | Descrição |
|--------|------|-----------|
| GET | `/purchases/ops/queues` | Tamanho das filas |
| GET | `/purchases/ops/worker` | Métricas do worker |
| GET | `/purchases/ops/dlq?size=20` | Inspecionar DLQ |
| GET | `/purchases/ops/retry-schedule?size=20` | Retries agendados (ZSET) |
| POST | `/purchases/ops/dlq/reprocess` | Reenfileirar DLQ → retry |

**Reprocessar DLQ:**
```json
{ "count": 10 }
```

---

## Scripts npm

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev com hot reload |
| `npm run build` | Compila TypeScript |
| `npm start` | Produção (`dist/`) |
| `npm test` | Testes de integração (Postgres + Redis) |
| `npm run migration:run` | Roda migrations |
| `npm run migration:revert` | Reverte última migration |

### Testes

Requisitos: **PostgreSQL** e **Redis** rodando (ex.: `docker compose up -d postgres redis`).

Os testes usam **Redis DB 1** por padrão para não conflitar com a API em execução (DB 0).

```bash
npm run migration:run
npm test
```

Cobertura atual:
- Fluxo E2E: reserva → persistência → PIX → webhook → emissão de ingressos
- Concorrência: estoque Redis nunca fica negativo / oversell

---

## Testes de carga

Scripts K6 e instruções detalhadas: **[STRESS_TEST_README.md](./STRESS_TEST_README.md)**

---

## Estrutura do projeto

```
src/
  controllers/    # HTTP handlers
  services/       # Regras de negócio
  workers/        # Persistência + expiração
  entities/       # TypeORM
  migrations/     # Schema PostgreSQL
  routes/         # Rotas Express
  middlewares/    # Auth, roles, rate limit
  config/         # Env, Redis, logger, DB
```

---

## Fluxo completo (produtor → cliente)

1. Admin promove produtor: `PATCH /auth/users/:id/role` → `{ "role": "PRODUCER" }`
2. Producer cria evento: `POST /events`
3. Producer publica: `PATCH /events/:id` → `{ "status": "PUBLISHED" }`
4. Producer cria lote: `POST /events/:id/lots`
5. Cliente registra/login → `POST /auth/register` / `POST /auth/login`
6. Cliente lista eventos: `GET /events`
7. Cliente reserva: `POST /purchases/reserve`
8. Cliente faz poll: `GET /purchases/reservations/:id` até `AWAITING_PAYMENT`
9. Gateway confirma pagamento: `POST /payments/webhook`
10. Cliente vê ingressos: `GET /tickets/me`
11. Cliente adiciona à wallet: `GET /wallet/apple/:ticketId`
12. No dia do evento: `POST /tickets/check-in`
