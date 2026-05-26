# Stress Test com K6 — Fluxo de Reserva

Este teste simula **alta concorrência** no fluxo crítico da API:

1. `POST /auth/login` — obtém JWT
2. `POST /purchases/reserve` — reserva ingressos (rota protegida; no código está em `/purchases/reserve`, não `/tickets/reserve`)

## Cenário K6

| Fase | Duração | VUs |
|------|---------|-----|
| Ramp-up | 20s | 0 → 200 |
| Pico | 10s | 200 |
| Ramp-down | 5s | 200 → 0 |

Sob carga, é **esperado** receber `409` (estoque insuficiente) ou `400` (lock não adquirido) em parte das requisições — isso indica que o sistema está protegendo o estoque.

---

## Pré-requisitos

1. **Stack rodando via Docker Compose** (app + postgres + redis):

```bash
docker compose up -d --build
docker compose run --rm migrate
```

2. **Dados de teste** — usuário e lote com estoque:

### 2.1 Criar usuário de teste

#### Windows PowerShell (recomendado)

No PowerShell, `curl` normalmente é um alias de `Invoke-WebRequest` (a sintaxe `-H/-d` do curl “clássico” não funciona). Use `Invoke-RestMethod`:

```powershell
$body = @{
  name     = "Stress User"
  email    = "stress@test.com"
  password = "stress123"
  document = "00000000000"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "http://localhost:3000/auth/register" `
  -ContentType "application/json" `
  -Body $body
```

#### curl (Linux/macOS/Git Bash) ou `curl.exe` no Windows

```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Stress User\",\"email\":\"stress@test.com\",\"password\":\"stress123\",\"document\":\"00000000000\"}"
```

### 2.2 Criar evento e lote (via PostgreSQL)

Substitua os UUIDs se preferir; o importante é guardar o `ticket_lot_id` para o K6.

```bash
docker exec -it app-postgres psql -U postgres -d app_db
```

```sql
INSERT INTO events (id, title, description, date, location, status)
VALUES (
  uuid_generate_v4(),
  'Evento Stress Test',
  'Evento para teste de carga K6',
  NOW() + INTERVAL '1 day',
  'Arena Teste',
  'PUBLISHED'
);

-- Copie o id do evento criado:
-- SELECT id FROM events WHERE title = 'Evento Stress Test';

INSERT INTO ticket_lots (id, event_id, name, price, total_quantity, available_quantity)
VALUES (
  uuid_generate_v4(),
  '<EVENT_ID_AQUI>',
  'Lote Stress',
  5000,
  50000,
  50000
);

-- Copie o id do lote:
-- SELECT id FROM ticket_lots WHERE name = 'Lote Stress';
```

Anote:

- `TEST_EMAIL=stress@test.com`
- `TEST_PASSWORD=stress123`
- `TICKET_LOT_ID=<uuid-do-lote>`

---

## Executar K6 via Docker (recomendado)

O container K6 deve estar na **mesma rede Docker** que o serviço `app-api`.

### 1. Descobrir o nome da rede

```bash
docker network ls
```

Geralmente será algo como `novapasta_default` (nome da pasta do projeto + `_default`).

### 2. Rodar o teste (Linux / macOS / Git Bash)

```bash
docker run --rm -i \
  --network novapasta_default \
  -v "$(pwd)/stress-test.js:/scripts/stress-test.js:ro" \
  -e BASE_URL=http://app-api:3000 \
  -e TEST_EMAIL=stress@test.com \
  -e TEST_PASSWORD=stress123 \
  -e TICKET_LOT_ID=<SEU_TICKET_LOT_UUID> \
  -e RESERVE_QUANTITY=1 \
  grafana/k6 run /scripts/stress-test.js
```

### 3. Rodar o teste (Windows PowerShell)

```powershell
docker run --rm -i `
  --network novapasta_default `
  -v "${PWD}/stress-test.js:/scripts/stress-test.js:ro" `
  -e BASE_URL=http://app-api:3000 `
  -e TEST_EMAIL=stress@test.com `
  -e TEST_PASSWORD=stress123 `
  -e TICKET_LOT_ID=<SEU_TICKET_LOT_UUID> `
  -e RESERVE_QUANTITY=1 `
  grafana/k6 run /scripts/stress-test.js
```

> **Nota:** `BASE_URL=http://app-api:3000` usa o hostname do serviço definido no `docker-compose.yml` (`container_name: app-api`). Não use `localhost` dentro do container K6.

### 4. API rodando no host (`npm run dev`) em vez do container

Use `host.docker.internal` (Docker Desktop no Windows/macOS):

```powershell
docker run --rm -i `
  -v "${PWD}/stress-test.js:/scripts/stress-test.js:ro" `
  -e BASE_URL=http://host.docker.internal:3000 `
  -e TEST_EMAIL=stress@test.com `
  -e TEST_PASSWORD=stress123 `
  -e TICKET_LOT_ID=<SEU_TICKET_LOT_UUID> `
  grafana/k6 run /scripts/stress-test.js
```

---

## Variáveis de ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `BASE_URL` | Não (padrão `http://localhost:3000`) | URL base da API |
| `TEST_EMAIL` | Sim | E-mail do usuário de teste |
| `TEST_PASSWORD` | Sim | Senha do usuário de teste |
| `TICKET_LOT_ID` | Sim | UUID do `ticket_lots` |
| `RESERVE_QUANTITY` | Não (padrão `1`) | Ingressos por requisição |

---

## K6 instalado localmente (opcional)

```bash
# macOS
brew install k6

# Executar sem Docker
export BASE_URL=http://localhost:3000
export TEST_EMAIL=stress@test.com
export TEST_PASSWORD=stress123
export TICKET_LOT_ID=<uuid>

k6 run stress-test.js
```

---

## Interpretar resultados

- **`reserve status 201`** — reserva + pedido + PIX criados com sucesso
- **`reserve status 409`** — estoque esgotado (comportamento esperado sob pico)
- **`reserve status 400`** — lock não adquirido ou validação (concorrência no mesmo lote)
- **p95 de latência (por endpoint)** — o script separa métricas por tag `endpoint:reserve` e `endpoint:login`

> Importante: o script faz **login apenas no `setup()`** para não distorcer o p95 com bcrypt. O p95 global (`http_req_duration`) mistura endpoints e não é um bom indicador do gargalo do fluxo de reserva.

### Monitorar durante o teste

```bash
docker logs -f app-api
docker stats app-api app-postgres app-redis
```

---

## Scripts adicionais

### 1) Reserva pura (pico de concorrência)

Arquivo: `stress-test.js` — apenas `POST /purchases/reserve`.

### 2) Fluxo E2E (reserva → poll PIX → webhook)

Arquivo: `stress-test-full.js`

```powershell
docker run --rm -i `
  --network novapasta_default `
  -v "${PWD}/stress-test-full.js:/scripts/stress-test-full.js:ro" `
  -e BASE_URL=http://app-api:3000 `
  -e TEST_EMAIL=stress@test.com `
  -e TEST_PASSWORD=stress123 `
  -e TICKET_LOT_ID=<UUID_DO_LOTE> `
  grafana/k6 run /scripts/stress-test-full.js
```

Após reservar, o cliente deve consultar:

`GET /purchases/reservations/:reservationId` (JWT do dono)

Fases retornadas: `PENDING_PERSISTENCE` → `PENDING_PAYMENT` → `AWAITING_PAYMENT` (com `payment.pixCopyPaste`) → `PAID`.

### 3) Carga no webhook

Arquivo: `stress-test-webhook.js`

Opção A — IDs já existentes no banco:

```powershell
docker run --rm -i `
  --network novapasta_default `
  -v "${PWD}/stress-test-webhook.js:/scripts/stress-test-webhook.js:ro" `
  -e BASE_URL=http://app-api:3000 `
  -e ORDER_IDS=<order-uuid-1>,<order-uuid-2> `
  grafana/k6 run /scripts/stress-test-webhook.js
```

Opção B — setup cria pedidos automaticamente:

```powershell
docker run --rm -i `
  --network novapasta_default `
  -v "${PWD}/stress-test-webhook.js:/scripts/stress-test-webhook.js:ro" `
  -e BASE_URL=http://app-api:3000 `
  -e TEST_EMAIL=stress@test.com `
  -e TEST_PASSWORD=stress123 `
  -e TICKET_LOT_ID=<UUID_DO_LOTE> `
  -e SETUP_ORDERS_COUNT=20 `
  grafana/k6 run /scripts/stress-test-webhook.js
```

---

## Monitoramento operacional (fila + worker)

### Fila de persistência (equipe)

`GET /purchases/ops/queues` — requer JWT com role `ADMIN` ou `PRODUCER`.

Resposta:

```json
{
  "persistQueueLength": 12,
  "persistQueueKey": "queue:reservation:persist",
  "sampledAt": "..."
}
```

### Logs

Durante o teste, monitore:

- `ReservationPersistenceWorker` — dequeue, persistência, PIX em cache
- `PaymentService` — webhooks `payment.succeeded` / `payment.failed`

```bash
docker logs -f app-api
```

---

## Limpar dados após o teste (opcional)

```sql
TRUNCATE tickets, orders, reservations, ticket_lots, events, users RESTART IDENTITY CASCADE;
```

Ou recrie apenas o estoque do lote:

```sql
UPDATE ticket_lots SET available_quantity = 50000 WHERE name = 'Lote Stress';
```
