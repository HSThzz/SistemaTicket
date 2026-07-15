---
name: frontend-feature
description: >-
  How to add a frontend feature in SistemaTicket: module api service, types,
  page with Mantine/useForm, App.tsx routes, guards, and API error messages.
  Use when creating or changing React pages, services, routes, or UI flows in frontend/.
---

# How-to: feature no frontend

Espelhe um feature existente no mesmo domínio (ex.: `identity/features/auth`, `catalog/features/producer`).

## Checklist

1. Tipos em `shared/types/api.ts` (se contrato novo/alterado)
2. Funções em `modules/<domain>/api/<domain>Service.ts`
3. Página/componente em `features/<feature>/pages|components/`
4. Rota em `app/App.tsx` (com o guard certo)
5. Mensagem de erro em `shared/utils/apiErrorMessages.ts` (se `code` novo)
6. CSS em `styles/<area>.css` + tokens `--vibra-*` se precisar de visual novo
7. Path helpers no módulo (`utils/*Paths.ts`) quando URL for domínio-específico

## Estrutura

```
modules/<domain>/
  api/<domain>Service.ts
  utils/
  features/<feature>/
    pages/<Name>Page.tsx
    components/
    hooks/
```

Alias: `@/...` → `src/...`.

## API service

```ts
import { api } from "@/shared/api/client";
import type { Thing } from "@/shared/types/api";

export async function fetchThing(id: string): Promise<Thing> {
  const { data } = await api.get<Thing>(`/things/${id}`);
  return data;
}
```

- Funções async (não classes).
- Tipar com interfaces de `shared/types/api.ts`.

## Página

- Mantine + `useForm` (`@mantine/form`) + `notifications` (`@mantine/notifications`).
- Loading local: `const [submitting, setSubmitting] = useState(false)`.
- Fetch inicial: `PageLoader` enquanto carrega.
- Erros: `getApiErrorMessage(error, "fallback.")`; ramificar com `getApiErrorCode(error)` quando necessário.

```ts
try {
  await thingService.create(values);
  notifications.show({ title: "...", message: "...", color: "green", icon: <IconCheck size={18} /> });
} catch (error) {
  notifications.show({
    title: "Falha",
    message: getApiErrorMessage(error, "Não foi possível salvar."),
    color: "red",
    icon: <IconX size={18} />,
  });
}
```

## Rotas e guards

Em `app/App.tsx`, aninhar sob:

| Guard | Uso |
|-------|-----|
| `GuestRoute` | login/register |
| `ProtectedRoute` | autenticado |
| `ProducerRoute` | painel produtor |
| `CheckInRoute` | check-in |
| `AdminRoute` | staff/admin |

Paths em português: `/eventos`, `/produtor`, `/pedidos`, etc.

## Paths de domínio

Preferir helpers (`eventPath`, `eventCheckoutPath`) em vez de string concatenada.

## Estilo

- Classes kebab-case / BEM-ish: `.producer-nav-tab.is-active`
- CSS global em `frontend/src/styles/`
- Tokens: `--vibra-*` e vars Mantine (`--mantine-color-brand-6`)
- Não inventar tema purple genérico; seguir a marca VIBRA existente

## Relacionado

- Skill: [domain-errors-api](../domain-errors-api/SKILL.md)
- Skill: [project-architecture](../project-architecture/SKILL.md)
