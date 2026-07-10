import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getUserPwdAt,
  isAuthTokenRevoked,
} from "../../src/modules/identity/application/helpers/authToken";

describe("authToken", () => {
  it("treats missing password change as pwdAt 0", () => {
    assert.equal(getUserPwdAt(null), 0);
    assert.equal(getUserPwdAt(undefined), 0);
  });

  it("revokes tokens issued before the last password change", () => {
    const passwordChangedAt = new Date("2026-07-10T12:00:00.000Z");

    assert.equal(isAuthTokenRevoked(0, passwordChangedAt), true);
    assert.equal(isAuthTokenRevoked(undefined, passwordChangedAt), true);
    assert.equal(
      isAuthTokenRevoked(passwordChangedAt.getTime(), passwordChangedAt),
      false,
    );
  });

  it("keeps legacy tokens valid when password was never changed", () => {
    assert.equal(isAuthTokenRevoked(undefined, null), false);
    assert.equal(isAuthTokenRevoked(0, null), false);
  });
});
