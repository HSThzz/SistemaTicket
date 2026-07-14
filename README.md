# SistemaTicket (TicketFlow)

Plataforma full stack para **venda de ingressos**: catálogo de eventos, reserva atômica de estoque, pagamento PIX, emissão de tickets com QR e integração com Apple/Google Wallet.

Monorepo com **backend** (API REST) e **frontend** (SPA React), organizados em **Domain-Driven Design (DDD)** por bounded contexts.

## Stack

| Camada | Tecnologias |
|--------|-------------|
| **API** | Node.js 20+, Express 5, TypeScript, TypeORM, PostgreSQL |
| **Cache / filas** | Redis (estoque, reservas TTL, workers, rate limit) |
| **UI** | React 19, Vite, Mantine, React Router |
| **Auth** | JWT (Bearer) |
| **Pagamento** | PIX simulado ou Mercado Pago |

## Estrutura do repositório

```
SistemaTicket/
├── backend/          # API REST + workers + migrations
├── frontend/         # SPA para cliente, produtor e admin
├── docs/
│   └── ARCHITECTURE.md   # DDD, camadas e bounded contexts
└── README.md         # Este arquivo
```

### Bounded contexts

| Contexto | Descrição |
|----------|-----------|
| **Identity** | Cadastro, login, papéis (`CLIENT`, `PRODUCER`, `ADMIN`) |
| **Catalog** | Eventos, lotes, publicação |
| **Sales** | Reserva Redis, pedidos, expiração |
| **Payment** | Cobrança PIX, webhooks, reembolso |
| **Ticketing** | Ingressos, check-in, wallet digital |

Detalhes em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Pendências e melhorias: [docs/ROADMAP.md](docs/ROADMAP.md).

## Pré-requisitos

- **Node.js** ≥ 20
- **PostgreSQL** e **Redis** (local ou Docker)
- Opcional: [Docker](https://www.docker.com/) para subir dependências

## Início rápido

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run migration:run
npm run seed
npm run dev
```

API em `http://localhost:3000`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # se existir; VITE_API_URL=http://localhost:3000
npm install
npm run dev
```

App em `http://localhost:5173`.

### Docker (backend)

```bash
cd backend
docker compose up -d --build
docker compose run --rm migrate
```

## Usuários de demonstração (só local)

Após `npm run seed` no backend (**não use em produção**):

| Papel | E-mail | Senha |
|-------|--------|-------|
| Admin | `admin@ticketflow.test` | `Senha123!` |
| Produtor | `producer@ticketflow.test` | `Senha123!` |
| Cliente | `client@ticketflow.test` | `Senha123!` |

## Fluxo principal (cliente)

1. Listar eventos publicados → `GET /events`
2. Reservar ingressos → `POST /purchases/reserve`
3. Acompanhar reserva → `GET /purchases/reservations/:id`
4. Pagar via PIX (webhook confirma) → `POST /payments/webhook`
5. Ver ingressos → `GET /tickets/me`
6. Adicionar à wallet → `GET /wallet/apple/:ticketId` ou Google equivalente

Documentação completa da API: [backend/README.md](backend/README.md).

## Scripts úteis

### Backend (`cd backend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | API em modo desenvolvimento |
| `npm run build` | Compila TypeScript |
| `npm run test` | Testes de integração |
| `npm run migration:run` | Aplica migrations |
| `npm run seed` | Reseta e popula dados demo (só local) |
| `npm run docs` | Gera HTML a partir do JSDoc (TypeDoc) |

### Frontend (`cd frontend`)

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Servidor Vite |
| `npm run build` | Build de produção |
| `npm run lint` | ESLint |

## Documentação no código (JSDoc)

O código-fonte está documentado com **JSDoc** (`/** ... */`):

- **Backend:** serviços de aplicação, controllers, workers, gateways, entidades e erros de domínio em `backend/src/`
- **Frontend:** clientes HTTP por feature, hooks, contexto de auth e utilitários em `frontend/src/`

Para navegar a documentação gerada:

```bash
cd backend
npm run docs
# Abra backend/docs-api/index.html
```

## Variáveis de ambiente

- **Backend:** `backend/.env.example`
- **Frontend:** `VITE_API_URL` apontando para a API (padrão `http://localhost:3000`)

Em produção, configure `JWT_SECRET`, `PAYMENT_WEBHOOK_SECRET` e credenciais do gateway PIX.

## Testes

```bash
cd backend
# PostgreSQL + Redis rodando
npm run migration:run
npm test
```

Os testes usam Redis DB `1` por padrão para não conflitar com a API em desenvolvimento.

## Licença

ISC — ver `package.json` de cada pacote.
