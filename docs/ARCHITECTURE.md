# Arquitetura DDD — SistemaTicket

O projeto segue **Domain-Driven Design (DDD)** em estilo **modular monolith**: bounded contexts explícitos, camadas por responsabilidade, sem microserviços.

## Bounded contexts

| Contexto | Responsabilidade | Backend | Frontend (API client) |
|----------|------------------|---------|------------------------|
| **Identity** | Usuários, login, JWT, papéis | `modules/identity` | `features/identity` |
| **Catalog** | Eventos, lotes, publicação | `modules/catalog` | `features/catalog` |
| **Sales** | Reservas, pedidos, estoque Redis | `modules/sales` | `features/sales` |
| **Payment** | PIX, webhooks, reembolso | `modules/payment` | — (via Sales na UI) |
| **Ticketing** | Ingressos, check-in, wallet | `modules/ticketing` | `features/ticketing` |

## Backend (`backend/src`)

```
src/
├── app.ts, server.ts          # Bootstrap
├── seeds/                     # Dados demo
├── shared/                    # Cross-cutting
│   ├── kernel/                # Enums e tipos compartilhados
│   ├── application/           # Serviços transversais (health, filas)
│   ├── infrastructure/
│   │   ├── config/            # Env, Redis, logger, TypeORM
│   │   └── persistence/       # Entities + migrations
│   ├── interfaces/http/       # Middlewares, rotas agregadas
│   └── runtime/               # Registro de workers
└── modules/
    └── <contexto>/
        ├── domain/errors/     # Erros de negócio do contexto
        ├── application/       # Casos de uso / orquestração
        ├── infrastructure/    # Workers, gateways externos
        └── interfaces/http/   # Controllers + routes
```

### Camadas

1. **Domain** — regras e erros (`domain/errors`). Entidades TypeORM ficam em `shared/infrastructure/persistence` (modelo de persistência compartilhado; evolução futura: mapear para agregados de domínio puros).
2. **Application** — serviços que coordenam repositórios, Redis e outros contextos.
3. **Infrastructure** — TypeORM (shared), Redis, Mercado Pago, workers.
4. **Interfaces** — Express (HTTP).

### Dependências entre contextos

- **Sales** → **Payment** (persistência de reserva gera cobrança PIX).
- **Payment** → entidades compartilhadas (Order, Ticket).
- Middlewares de auth em **shared** importam **Identity** (acoplamento aceito na borda HTTP).

## Frontend (`frontend/src`)

```
src/
├── shared/api/                # Cliente HTTP (axios)
├── features/<contexto>/api/   # Chamadas REST por contexto
├── pages/, components/        # UI (organização por tela)
├── context/, hooks/, utils/
└── types/                     # Contratos alinhados à API
```

Páginas e componentes permanecem por fluxo de UI; a camada **features** concentra integração com a API por bounded context.

## Documentação (JSDoc)

Todo o código de negócio está anotado com **JSDoc** em português (`@module`, `@param`, `@returns`, `@throws`).

- Gerar site HTML da API: `cd backend && npm run docs` → `backend/docs-api/index.html`
- Migrations TypeORM não são documentadas (geradas pelo schema)

## Comandos

```bash
# Backend
cd backend
npm run dev
npm run migration:run
npm run build
npm run docs

# Frontend
cd frontend
npm run dev
```

## Evolução sugerida

- Extrair interfaces de repositório em `domain/` e implementar em `infrastructure/persistence`.
- Domain events (ex.: `OrderPaid`) entre Sales e Ticketing.
- Mover páginas React para `features/<contexto>/pages/` quando um contexto crescer.
