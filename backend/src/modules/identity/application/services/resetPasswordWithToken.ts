import { Logger } from "../../../../shared/infrastructure/config/logger";
import { AppDataSource } from "../../../../shared/infrastructure/config/data-source";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  InvalidPasswordResetTokenError,
  PasswordReuseError,
} from "../../domain/errors/AuthError";
import {
  resetPasswordSchema,
  type ResetPasswordInputSchema,
} from "../../validators/schema/resetPasswordSchema";
import { consumePasswordResetToken } from "../commands/consumePasswordResetToken";
import { invalidatePasswordResetTokensForUser } from "../commands/invalidatePasswordResetTokensForUser";
import { updateUser } from "../commands/updateUser";
import { buildAuthResponse } from "../helpers/buildAuthResponse";
import { hashPassword, verifyPassword } from "../helpers/passwordHash";
import { hashPasswordResetToken } from "../helpers/passwordResetToken";
import { findValidPasswordResetTokenByHash } from "../queries/findValidPasswordResetTokenByHash";

const CONTEXT = "resetPasswordWithToken";

export async function resetPasswordWithToken(input: ResetPasswordInputSchema) {
  const data = validateSchema(resetPasswordSchema, input);
  const tokenHash = hashPasswordResetToken(data.token);

  const resetToken = await findValidPasswordResetTokenByHash(tokenHash);

  if (!resetToken || resetToken.usedAt) {
    throw new InvalidPasswordResetTokenError();
  }

  if (resetToken.expiresAt.getTime() <= Date.now()) {
    Logger.getInstance().warn(CONTEXT, "Password reset rejected", {
      userId: resetToken.userId,
      reason: "expired_token",
    });
    throw new InvalidPasswordResetTokenError();
  }

  const user = resetToken.user;

  const reusesCurrentPassword = await verifyPassword(
    data.newPassword,
    user.passwordHash,
  );

  if (reusesCurrentPassword) {
    throw new PasswordReuseError();
  }

  const passwordHash = await hashPassword(data.newPassword);
  const passwordChangedAt = new Date();

  const updatedUser = await AppDataSource.transaction(async (manager) => {
    const consumed = await consumePasswordResetToken(
      resetToken.id,
      passwordChangedAt,
      manager,
    );

    if (!consumed) {
      throw new InvalidPasswordResetTokenError();
    }

    const savedUser = await updateUser(
      user,
      { passwordHash, passwordChangedAt },
      manager,
    );

    await invalidatePasswordResetTokensForUser(user.id, manager);

    return savedUser;
  });

  Logger.getInstance().info(CONTEXT, "Password reset completed", {
    userId: user.id,
  });

  return buildAuthResponse(updatedUser);
}
