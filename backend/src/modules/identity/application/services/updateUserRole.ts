import { Logger } from "../../../../shared/infrastructure/config/logger";
import { AdminAuditAction, UserRole } from "../../../../shared/kernel/enums";
import { isSuperAdmin } from "../../../../shared/kernel/staffRoles";
import { validateSchema } from "../../../../shared/kernel/validateSchema";
import {
  RoleAssignmentForbiddenError,
  UserNotFoundError,
} from "../../domain/errors/AuthError";
import {
  updateUserRoleSchema,
  type UpdateUserRoleInputSchema,
} from "../../validators/schema/updateUserRoleSchema";
import { userIdSchema } from "../../validators/schema/userIdSchema";
import { createAdminAuditLog } from "../commands/createAdminAuditLog";
import { updateUser } from "../commands/updateUser";
import { findOneUserById } from "../queries/findOneUserById";

const CONTEXT = "updateUserRole";

export interface UpdateUserRoleActor {
  userId: string;
  role: UserRole;
}

export async function updateUserRole(
  userId: string,
  input: UpdateUserRoleInputSchema,
  actor: UpdateUserRoleActor,
) {
  if (!isSuperAdmin(actor.role)) {
    throw new RoleAssignmentForbiddenError();
  }

  const id = validateSchema(userIdSchema, userId);
  const data = validateSchema(updateUserRoleSchema, input);

  const user = await findOneUserById(id);

  if (!user) {
    throw new UserNotFoundError(id);
  }

  const previousRole = user.role;

  await updateUser(user, { role: data.role });

  await createAdminAuditLog({
    actorUserId: actor.userId,
    action: AdminAuditAction.USER_ROLE_UPDATED,
    targetType: "user",
    targetId: user.id,
    metadata: {
      email: user.email,
      previousRole,
      newRole: user.role,
    },
  });

  Logger.getInstance().info(CONTEXT, "User role updated", {
    actorUserId: actor.userId,
    userId: user.id,
    email: user.email,
    previousRole,
    role: user.role,
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };
}
