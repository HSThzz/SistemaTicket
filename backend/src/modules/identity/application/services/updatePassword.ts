import bcrypt from "bcrypt";
import { Logger } from "../../../../shared/infrastructure/config/logger";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  InvalidCurrentPasswordError,
  PasswordReuseError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import {
  updatePasswordSchema,
  type UpdatePasswordInputSchema,
} from "../../validators/schema/updatePasswordSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { updateUser } from "../commands/updateUser";
import { buildAuthResponse } from "../helpers/buildAuthResponse";
import { findOneUserById } from "../queries/findOneUserById";

const CONTEXT = "updatePassword";
const BCRYPT_ROUNDS = 12;

export async function updatePassword(
  userId: string,
  input: UpdatePasswordInputSchema,
) {
  const id = validateSchema(userIdSchema, userId);
  const data = validateSchema(updatePasswordSchema, input);

  const user = await findOneUserById(id);

  if (!user) {
    throw new UserNotFoundError(id);
  }

  const passwordMatches = await bcrypt.compare(
    data.currentPassword,
    user.passwordHash,
  );

  if (!passwordMatches) {
    Logger.getInstance().warn(CONTEXT, "Password change rejected", {
      userId: id,
      reason: "invalid_current_password",
    });
    throw new InvalidCurrentPasswordError();
  }

  const reusesCurrentPassword = await bcrypt.compare(
    data.newPassword,
    user.passwordHash,
  );

  if (reusesCurrentPassword) {
    Logger.getInstance().warn(CONTEXT, "Password change rejected", {
      userId: id,
      reason: "password_reuse",
    });
    throw new PasswordReuseError();
  }

  const passwordHash = await bcrypt.hash(data.newPassword, BCRYPT_ROUNDS);
  const passwordChangedAt = new Date();

  const updatedUser = await updateUser(user, { passwordHash, passwordChangedAt });

  Logger.getInstance().info(CONTEXT, "Password updated", { userId: id });

  return buildAuthResponse(updatedUser);
}
