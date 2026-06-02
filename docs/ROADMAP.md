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
- [x] **Helmet** (headers de segurança HTTP)
- [x] **Zod** nas rotas críticas (auth, reserva, admin)
- [x] **Painel ADMIN** (`/admin`): buscar usuário, alterar papel, consultar e reembolsar pedidos
- [x] CI frontend (lint + build)

## Crítico / curto prazo

| Item | Descrição |
|------|-----------|
| Reconciliação de estoque | Job que alinha `stock:ticket-lot:*` (Redis) com `availableQuantity` (PostgreSQL) |
| Testes Mercado Pago | Integração com webhook real ou sandbox em CI |
| Expandir Zod | Demais controllers (eventos, check-in, pagamentos) |

## Alta prioridade

| Item | Descrição |
|------|-----------|
| OpenAPI + tipos gerados | Contrato único API ↔ frontend |
| Repositórios DDD | Interfaces em `domain/`, implementação TypeORM em `infrastructure/` |
| Domain events | Ex.: `OrderPaid` → emissão de tickets desacoplada |

## Média prioridade

| Item | Descrição |
|------|-----------|
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
