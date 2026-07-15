import { Logger } from "../../../../shared/infrastructure/config/logger";
import {
  isUniqueViolation,
  isUniqueViolationOn,
} from "../../../../shared/infrastructure/persistence/isUniqueViolation";
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
import { hashPassword } from "../helpers/passwordHash";
import { findOneUserByDocument } from "../queries/findOneUserByDocument";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";

const CONTEXT = "registerUser";

export async function registerUser(
  input: RegisterUserInputSchema,
) {
  const data = validateSchema(registerUserSchema, input);

  const existingUser = await findOneUserByEmail(data.email);

  if (existingUser) {
    throw new EmailAlreadyExistsError();
  }

  const existingDocument = await findOneUserByDocument(data.document);

  if (existingDocument) {
    throw new DocumentAlreadyExistsError();
  }

  const passwordHash = await hashPassword(data.password);

  try {
    const user = await createUser({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      document: data.document,
      role: UserRole.CLIENT,
      termsAcceptedAt: new Date(),
      termsVersion: data.termsVersion,
    });

    Logger.getInstance().info(CONTEXT, "User registered", {
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return buildAuthResponse(user);
  } catch (error) {
    if (isUniqueViolationOn(error, "email")) {
      throw new EmailAlreadyExistsError();
    }

    if (isUniqueViolationOn(error, "document") || isUniqueViolation(error)) {
      throw new DocumentAlreadyExistsError();
    }

    throw error;
  }
}
