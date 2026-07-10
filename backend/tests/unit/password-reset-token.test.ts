import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  generatePasswordResetToken,
  hashPasswordResetToken,
} from "../../src/modules/identity/application/helpers/passwordResetToken";

describe("passwordResetToken", () => {
  it("hashes tokens deterministically", () => {
    const hashA = hashPasswordResetToken("abc123");
    const hashB = hashPasswordResetToken("abc123");

    assert.equal(hashA, hashB);
    assert.equal(hashA.length, 64);
  });

  it("generates unique raw tokens with expiry", () => {
    const first = generatePasswordResetToken();
    const second = generatePasswordResetToken();

    assert.notEqual(first.rawToken, second.rawToken);
    assert.equal(first.tokenHash, hashPasswordResetToken(first.rawToken));
    assert.ok(first.expiresAt.getTime() > Date.now());
  });
});
