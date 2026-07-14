import { Logger } from "../../../../shared/infrastructure/config/logger";
import { getAppPublicUrl } from "../../../../shared/infrastructure/config/appPublicUrl";
import { redactEmail } from "../../../../shared/kernel/redactEmail";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import { createPasswordResetToken } from "../commands/createPasswordResetToken";
import { invalidatePasswordResetTokensForUser } from "../commands/invalidatePasswordResetTokensForUser";
import { generatePasswordResetToken } from "../helpers/passwordResetToken";
import { findOneUserByEmail } from "../queries/findOneUserByEmail";
import {
  forgotPasswordSchema,
  type ForgotPasswordInputSchema,
} from "../../validators/schema/forgotPasswordSchema";
import { sendPasswordResetEmail } from "./sendPasswordResetEmail";

const CONTEXT = "requestPasswordReset";

function buildPasswordResetUrl(rawToken: string): string {
  return `${getAppPublicUrl()}/redefinir-senha?token=${encodeURIComponent(rawToken)}`;
}

export async function requestPasswordReset(input: ForgotPasswordInputSchema) {
  const data = validateSchema(forgotPasswordSchema, input);

  const user = await findOneUserByEmail(data.email);

  if (user) {
    await invalidatePasswordResetTokensForUser(user.id);

    const { rawToken, tokenHash, expiresAt } = generatePasswordResetToken();

    await createPasswordResetToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    try {
      await sendPasswordResetEmail({
        to: user.email,
        userName: user.name,
        resetUrl: buildPasswordResetUrl(rawToken),
      });
    } catch (error) {
      // Remove o token para o usuário poder tentar de novo com um link novo.
      await invalidatePasswordResetTokensForUser(user.id);

      Logger.getInstance().error(CONTEXT, "Failed to send password reset email", {
        userId: user.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    Logger.getInstance().info(CONTEXT, "Password reset requested for unknown email", {
      email: redactEmail(data.email),
    });
  }

  // Sempre a mesma resposta (anti-enumeração), mesmo se o e-mail falhou.
  return { success: true as const };
}
