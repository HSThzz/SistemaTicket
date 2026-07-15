import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { shouldSkipGatewayRefund } from "../../src/modules/payment/application/helpers/shouldSkipGatewayRefund";

describe("shouldSkipGatewayRefund", () => {
  it("skips manual gateway ids and explicit flag", () => {
    assert.equal(shouldSkipGatewayRefund("manual:abc"), true);
    assert.equal(shouldSkipGatewayRefund(null), true);
    assert.equal(shouldSkipGatewayRefund(undefined), true);
    assert.equal(
      shouldSkipGatewayRefund("123456", { skipGatewayRefund: true }),
      true,
    );
    assert.equal(shouldSkipGatewayRefund("123456"), false);
  });
});
