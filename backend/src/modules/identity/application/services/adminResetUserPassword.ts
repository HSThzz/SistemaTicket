import { Logger } from "../../../../shared/infrastructure/config/logger";
import { AdminAuditAction, UserRole } from "../../../../shared/kernel/enums";
import { isStaffRole, isSuperAdmin } from "../../../../shared/kernel/staffRoles";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  AdminPasswordResetForbiddenError,
  AdminSelfPasswordResetForbiddenError,
  PasswordReuseError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import {
  adminResetUserPasswordSchema,
  type AdminResetUserPasswordInputSchema,
} from "../../validators/schema/adminResetUserPasswordSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { createAdminAuditLog } from "../commands/createAdminAuditLog";
import { invalidatePasswordResetTokensForUser } from "../commands/invalidatePasswordResetTokensForUser";
import { updateUser } from "../commands/updateUser";
import { hashPassword, verifyPassword } from "../helpers/passwordHash";
import { findOneUserById } from "../queries/findOneUserById";

const CONTEXT = "adminResetUserPassword";

export interface AdminResetUserPasswordActor {
  userId: string;
  role: UserRole;
}

export async function adminResetUserPassword(
  targetUserId: string,
  input: AdminResetUserPasswordInputSchema,
  actor: AdminResetUserPasswordActor,
) {
  if (!isStaffRole(actor.role)) {
    throw new AdminPasswordResetForbiddenError();
  }

  const id = validateSchema(userIdSchema, targetUserId);
  const data = validateSchema(adminResetUserPasswordSchema, input);

  if (actor.userId === id) {
    throw new AdminSelfPasswordResetForbiddenError();
  }

  const user = await findOneUserById(id);

  if (!user) {
    throw new UserNotFoundError(id);
  }

  if (
    !isSuperAdmin(actor.role) &&
    (user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN)
  ) {
    throw new AdminPasswordResetForbiddenError();
  }

  const reusesCurrentPassword = await verifyPassword(
    data.newPassword,
    user.passwordHash,
  );

  if (reusesCurrentPassword) {
    throw new PasswordReuseError();
  }

  const passwordHash = await hashPassword(data.newPassword);
  const passwordChangedAt = new Date();

  await updateUser(user, { passwordHash, passwordChangedAt });
  await invalidatePasswordResetTokensForUser(user.id);

  await createAdminAuditLog({
    actorUserId: actor.userId,
    action: AdminAuditAction.USER_PASSWORD_RESET,
    targetType: "user",
    targetId: user.id,
    metadata: {
      email: user.email,
      targetRole: user.role,
    },
  });

  Logger.getInstance().info(CONTEXT, "User password reset by admin", {
    actorUserId: actor.userId,
    userId: user.id,
    email: user.email,
  });

  return { success: true as const };
}
