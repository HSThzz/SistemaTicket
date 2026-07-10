import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { passwordSchema } from "../../src/modules/identity/validators/schema/passwordSchema";

describe("passwordSchema", () => {
  it("accepts a password that meets complexity rules", () => {
    const result = passwordSchema.safeParse("Senha123!");

    assert.equal(result.success, true);
  });

  it("rejects passwords shorter than 8 characters", () => {
    const result = passwordSchema.safeParse("Ab1");

    assert.equal(result.success, false);
  });

  it("rejects passwords without uppercase letters", () => {
    const result = passwordSchema.safeParse("senha123");

    assert.equal(result.success, false);
  });

  it("rejects passwords without lowercase letters", () => {
    const result = passwordSchema.safeParse("SENHA123");

    assert.equal(result.success, false);
  });

  it("rejects passwords without digits", () => {
    const result = passwordSchema.safeParse("SenhaForte!");

    assert.equal(result.success, false);
  });

  it("rejects passwords without special characters", () => {
    const result = passwordSchema.safeParse("Senha123");

    assert.equal(result.success, false);
  });
});
