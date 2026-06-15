import bcrypt from "bcrypt";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { UserRole } from "../../../../shared/kernel/enums";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  DocumentAlreadyExistsError,
  EmailAlreadyExistsError,
} from "../../domain/errors/AuthError";
import {
  registerUserSchema,
  type RegisterUserInputSchema,
} from "../../validators/schema/registerUserSchema";
import { createUser } from "../commands/createUser";
import { buildAuthResponse } from "../helpers/buildAuthResponse";
import { findOneUserByDocument } from "../queries/findOneUserByDocument";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";

const CONTEXT = "registerUser";
const BCRYPT_ROUNDS = 12;

export async function registerUser(
  input: RegisterUserInputSchema,
) {
  const data = validateSchema(registerUserSchema, input);

  const existingUser = await findOneUserByEmail(data.email);

  if (existingUser) {
    throw new EmailAlreadyExistsError(data.email);
  }

  const existingDocument = await findOneUserByDocument(data.document);

  if (existingDocument) {
    throw new DocumentAlreadyExistsError(data.document);
  }

  const passwordHash = await bcrypt.hash(data.password, BCRYPT_ROUNDS);

  const user = await createUser({
    name: data.name,
    email: data.email.toLowerCase(),
    passwordHash,
    document: data.document,
    role: UserRole.CLIENT,
  });

  Logger.getInstance().info(CONTEXT, "User registered", {
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  return buildAuthResponse(user);
}
