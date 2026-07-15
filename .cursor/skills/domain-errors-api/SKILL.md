---
name: domain-errors-api
description: >-
  How to define domain error codes in the backend and map them to HTTP status and
  Portuguese user messages on the frontend. Use when adding errors, changing API
  error responses, handleError in controllers, or apiErrorMessages.ts.
---

# How-to: erros de domínio e API

Contrato: JSON `{ error: string, code: string }` (opcionalmente `field` / `issues` em validação).

## Backend

### 1. Classe de erro

```ts
// domain/errors/ThingError.ts
export class ThingError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = "ThingError";
  }
}

export class ThingNotFoundError extends ThingError {
  constructor(message = "Thing not found") {
    super(message, "THING_NOT_FOUND");
    this.name = "ThingNotFoundError";
  }
}
```

- `code`: `SCREAMING_SNAKE`, estável (frontend e clientes dependem dele).
- Mensagem técnica/en ou pt — o usuário vê a tradução do frontend.

### 2. Throw no service

```ts
if (!thing) throw new ThingNotFoundError();
```

### 3. Mapear no controller

Ordem: `ValidationError` → erros específicos → base do módulo → fallback + `logger.error`.

| Tipo | Status típico |
|------|----------------|
| `ValidationError` | 400 |
| `*NotFoundError` | 404 |
| `*AccessDeniedError` / authz | 403 |
| Conflito de negócio (`*_EXISTS`, estoque) | 409 |
| Demais domain errors | 400 |
| Inesperado | 400/500 + log |

```ts
res.status(404).json({ error: error.message, code: error.code });
```

## Frontend

### 1. Mensagem amigável

Adicionar em `frontend/src/shared/utils/apiErrorMessages.ts`:

```ts
THING_NOT_FOUND: "Recurso não encontrado.",
```

Agrupar por domínio com comentário de seção.

### 2. Uso na UI

```ts
getApiErrorMessage(error, "Não foi possível concluir.");
getApiErrorCode(error); // ex.: "PENDING_ORDER_EXISTS" → Modal / redirect
```

Prioridade de `getApiErrorMessage`: validação Zod → mapa `code` → `error` do body → rede → fallback.

## Checklist ao criar um `code` novo

- [ ] Subclass + `code` no backend
- [ ] Status HTTP no `handleError` do controller
- [ ] Entrada em `API_ERROR_MESSAGES`
- [ ] Se a UI precisa de fluxo especial, branch com `getApiErrorCode`

## Não faça

- Códigos ad-hoc só na string `error` sem `code`
- Mensagens hard-coded na página quando já existe (ou deveria existir) entrada no mapa
- Reutilizar o mesmo `code` com significados diferentes
