import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { updatePasswordSchema } from "../../src/modules/identity/validators/schema/updatePasswordSchema";

describe("updatePasswordSchema", () => {
  it("accepts a new password different from the current one", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "Senha123!",
      newPassword: "NovaSenha456@",
    });

    assert.equal(result.success, true);
  });

  it("rejects when new password equals current password", () => {
    const result = updatePasswordSchema.safeParse({
      currentPassword: "Senha123!",
      newPassword: "Senha123!",
    });

    assert.equal(result.success, false);

    if (!result.success) {
      assert.equal(
        result.error.issues.some(
          (issue) => issue.message === "A nova senha deve ser diferente da senha atual",
        ),
        true,
      );
    }
  });
});
