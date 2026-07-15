---
name: backend-feature
description: >-
  How to add a backend use case in SistemaTicket: Zod schema, service, query/command,
  domain error, controller, routes, and shared schema reexport. Use when creating or
  changing API endpoints, services, queries, commands, or Express routes in backend/.
---

# How-to: feature no backend

Siga a ordem. Espelhe um módulo existente (`catalog` é o modelo canônico).

## Checklist

1. Zod em `modules/<m>/validators/schema/<name>Schema.ts`
2. Query e/ou command em `application/queries|commands/`
3. Service em `application/services/` com `validateSchema` + log
4. Domain error com `code` estável (se novo caso)
5. Controller method + `handleError` mapeando status HTTP
6. Reexport em `shared/interfaces/http/validation/<m>.schemas.ts`
7. Rota com `validateBody|Params|Query` + middlewares
8. Montar rota em `shared/interfaces/http/routes/index.ts` (só se recurso novo)

## 1. Schema (domínio)

```ts
// validators/schema/createThingSchema.ts
export const createThingSchema = z.object({
  title: z.string().trim().min(1).max(255),
});
export type CreateThingInputSchema = z.infer<typeof createThingSchema>;
```

## 2. Query / Command

- **Query**: só leitura via `createQueryBuilder` (nunca `.find`/`.findOne`/`count({ where })`).
- **Command**: só persistência (`save`/`remove`).
- Um export por arquivo; nome do arquivo = nome da função (`findOneThingById.ts`).

```ts
return AppDataSource.getRepository(Thing)
  .createQueryBuilder("thing")
  .where("thing.id = :id", { id })
  .getOne();
```

## 3. Service

```ts
const CONTEXT = "createThing";

export async function createThing(input: CreateThingInputSchema, actor: ...) {
  const data = validateSchema(createThingSchema, input);
  // regras de negócio + throws de domain error
  const saved = await createThingCommand({ ... });
  Logger.getInstance().info(CONTEXT, "Thing created", { thingId: saved.id });
  return saved;
}
```

- `validateSchema` em **todo** service (defesa em profundidade).
- `const CONTEXT = "<nomeDoService>"` no topo do arquivo.

## 4. Controller + rotas

- Controller chama o service; erros via `handleError` privado (específico → genérico).
- Rotas importam schemas do **reexport compartilhado**, não do `validators/schema` do módulo:

```ts
// shared/.../validation/catalog.schemas.ts
export { createThingSchema as createThingBodySchema } from ".../createThingSchema";

// thing.routes.ts
router.post("/", auth, validateBody(createThingBodySchema), (req, res) =>
  thingController.create(req, res),
);
```

## 5. Convenções de nome

| Tipo | Padrão |
|------|--------|
| Query | `findOneXById`, `findXsByY`, `countX`, `hasX`, `isX` |
| Command / service | mesmo verbo de negócio (`createEvent`, `reserveTickets`) |
| Error | `ThingNotFoundError` → `code: "THING_NOT_FOUND"` |
| Schema HTTP | `*BodySchema`, `*ParamsSchema`, `*QuerySchema` |
| Routes | `<resource>.routes.ts` + `export const thingController = new ThingController()` |

## 6. Logging

`Logger.getInstance().info|warn|error(CONTEXT, message, { ...meta })`

## Não faça

- Lógica de negócio no controller
- `.find()` em `application/queries`
- Redefinir Zod na rota
- Esquecer o reexport em `*.schemas.ts`

## Relacionado

- Rule: `.cursor/rules/typeorm-query-builder.mdc`
- Skill: [domain-errors-api](../domain-errors-api/SKILL.md)
- Skill: [typeorm-migrations](../typeorm-migrations/SKILL.md)
