/**
 * @file Schemas Zod para rotas de identidade.
 * @module shared/interfaces/http/validation/identity.schemas
 */

import { z } from "zod";
import { UserRole } from "../../../kernel/enums";

/** Corpo de cadastro de usuário cliente. */
export const registerBodySchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter ao menos 2 caracteres").max(255),
  email: z.string().trim().email("E-mail inválido").max(255),
  password: z
    .string()
    .min(6, "Senha deve ter ao menos 6 caracteres")
    .max(128),
  document: z
    .string()
    .trim()
    .min(11, "Documento inválido")
    .max(18),
});

/** Corpo de login. */
export const loginBodySchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

/** Corpo de alteração de papel (admin). */
export const updateRoleBodySchema = z.object({
  role: z.nativeEnum(UserRole, { message: "Papel inválido" }),
});

/** Query de busca de usuário por e-mail (admin). */
export const lookupUserQuerySchema = z.object({
  email: z.string().trim().email("E-mail inválido"),
});

/** Parâmetro UUID de usuário. */
export const userIdParamsSchema = z.object({
  userId: z.string().uuid("ID de usuário inválido"),
});
