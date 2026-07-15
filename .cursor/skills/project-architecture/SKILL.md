---
name: project-architecture
description: >-
  Map of SistemaTicket/VIBRA modules, layers, and where to put new code.
  Use when starting a feature, deciding backend vs frontend module, or when
  unsure which folder owns a change (catalog, sales, identity, ticketing, etc.).
---

# Arquitetura do projeto

Plataforma de ingressos **VIBRA**: `backend/` (Express + TypeORM) e `frontend/` (React + Mantine).

## Módulos de domínio (backend e frontend)

| Módulo | Responsabilidade |
|--------|------------------|
| `identity` | Auth, usuários, roles, admin de usuários |
| `catalog` | Eventos, lotes, check-in staff, slug público |
| `sales` | Reservas, pedidos, checkout |
| `payment` | Gateways (Mercado Pago), webhooks, workers de pagamento |
| `ticketing` | Ingressos emitidos, wallet, QR |
| `participation` | Solicitações de participação / influenciadores |
| `leads` | Captação de leads |
| `notifications` | Workers de entrega (e-mail/ingressos) |
| `integrations` | Integrações externas (frontend) |

Código compartilhado: `backend/src/shared/` e `frontend/src/shared/`.

## Backend — camadas por módulo

```
backend/src/modules/<module>/
  domain/errors/
  application/{commands,queries,services,helpers}/
  validators/schema/
  interfaces/http/          # Controller + *.routes.ts
  infrastructure/           # só se precisar (gateways, workers)
```

- **queries**: leitura (`createQueryBuilder` — ver rule `typeorm-query-builder`)
- **commands**: escrita (`repository.save` / delete)
- **services**: orquestra validate → query/command → log → retorno
- **HTTP schemas**: reexport em `backend/src/shared/interfaces/http/validation/*.schemas.ts`
- **Rotas montadas** em `backend/src/shared/interfaces/http/routes/index.ts`

## Frontend — camadas por módulo

```
frontend/src/modules/<domain>/
  api/<domain>Service.ts
  utils/
  features/<feature>/{pages,components,hooks,context,utils}/
```

- Tipos/DTOs: `frontend/src/shared/types/api.ts`
- Cliente HTTP: `frontend/src/shared/api/client.ts`
- Rotas: `frontend/src/app/App.tsx`
- Guards: `frontend/src/components/auth/*Route.tsx`
- CSS de feature: `frontend/src/styles/*.css` + tokens `--vibra-*` em `index.css`

## Skills relacionadas

- [backend-feature](../backend-feature/SKILL.md) — novo endpoint / use case
- [frontend-feature](../frontend-feature/SKILL.md) — página, service, rota
- [domain-errors-api](../domain-errors-api/SKILL.md) — erros + mensagens
- [typeorm-migrations](../typeorm-migrations/SKILL.md) — migrations
