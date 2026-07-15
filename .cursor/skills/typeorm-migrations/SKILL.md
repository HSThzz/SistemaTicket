---
name: typeorm-migrations
description: >-
  How to change the database schema in SistemaTicket with TypeORM: update entity,
  generate/run migrations under persistence/migrations. Use when adding columns,
  tables, indexes, or when the user mentions migration, schema, or TypeORM entity changes.
---

# How-to: migrations TypeORM

## Fluxo

1. Alterar a **entity** em `backend/src/modules/**/domain` ou onde a entity estiver (ex.: `shared` / module persistence).
2. Gerar migration a partir do diff (preferido) **ou** escrever migration manual se o generate falhar.
3. Revisar o SQL gerado (up/down).
4. Rodar localmente: `npm run migration:run` (cwd `backend/`).
5. Garantir que o app e queries usam o novo campo.

## Paths e scripts

- Migrations: `backend/src/shared/infrastructure/persistence/migrations/`
- DataSource: `backend/src/shared/infrastructure/config/data-source.ts`
- Scripts (`backend/package.json`):
  - `npm run migration:generate -- src/shared/infrastructure/persistence/migrations/NomeDaMigration`
  - `npm run migration:run`
  - `npm run migration:revert`
  - `npm run migration:show`

Nome: timestamp + PascalCase descritivo, ex. `1779827613034-AddSlugToEvents.ts`.

## Regras

- Nunca editar migration **já aplicada** em outros ambientes; crie uma nova.
- `down` deve reverter o `up` de forma segura.
- Colunas nullable / default quando houver dados existentes.
- Após schema change, atualizar serialize/DTOs e `frontend/src/shared/types/api.ts` se o campo for exposto.

## Queries

Leituras novas em `application/queries` usam `createQueryBuilder` (rule `typeorm-query-builder`).

## Relacionado

- Skill: [backend-feature](../backend-feature/SKILL.md)
