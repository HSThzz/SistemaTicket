# Roadmap — SistemaTicket

Itens priorizados para evolução do produto. Atualizado conforme entregas.

## Concluído recentemente

- [x] Arquitetura DDD modular (`shared/` + `modules/`)
- [x] JSDoc no código + README na raiz
- [x] `ReservationExpiryWorker` respeita `REDIS_DB` (keyspace notifications)
- [x] Validação de secrets em produção (`validateProductionConfig`)
- [x] Middleware global de erros HTTP (`errorHandler`)
- [x] Health check inclui `expiryWorker`
- [x] Teste de integração: expiração via TTL Redis + worker

## Crítico / curto prazo

| Item | Descrição |
|------|-----------|
| Reconciliação de estoque | Job que alinha `stock:ticket-lot:*` (Redis) com `availableQuantity` (PostgreSQL) |
| Testes Mercado Pago | Integração com webhook real ou sandbox em CI |
| Helmet + headers de segurança | Hardening HTTP na API |

## Alta prioridade

| Item | Descrição |
|------|-----------|
| Validação com Zod | Schemas nos controllers (substituir `if (!field)` manual) |
| Painel ADMIN (frontend) | Promover produtor (`PATCH /auth/users/:id/role`), reembolso (`POST /orders/:id/refund`) |
| OpenAPI + tipos gerados | Contrato único API ↔ frontend |
| CI frontend | `npm run build` e `npm run lint` no GitHub Actions |
| Repositórios DDD | Interfaces em `domain/`, implementação TypeORM em `infrastructure/` |

## Média prioridade

| Item | Descrição |
|------|-----------|
| Domain events | Ex.: `OrderPaid` → emissão de tickets desacoplada |
| Upload de imagem de evento | Storage (S3/Supabase) em vez de só URL |
| E2E Playwright | Fluxo reserva → PIX → ingressos |
| React Query | Cache e polling de reserva no checkout |
| Recuperação de senha | Fluxo e-mail + token |
| Refresh token / revogação JWT | Sessões mais seguras |

## Baixa prioridade / produto

- Notificações (e-mail/WhatsApp) de compra e lembrete
- Limite de ingressos por CPF
- Relatórios financeiros para produtor (CSV)
- i18n
- Code splitting no frontend (bundle Vite)

## Referências

- [ARCHITECTURE.md](./ARCHITECTURE.md) — bounded contexts e camadas
- [backend/README.md](../backend/README.md) — API e endpoints
