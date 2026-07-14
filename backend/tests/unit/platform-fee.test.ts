import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calculateOrderTotalWithPlatformFee,
  calculatePlatformFeeCents,
} from "../../src/shared/kernel/platformFee";

describe("platformFee", () => {
  it("calculates 5% rounded to cents", () => {
    assert.equal(calculatePlatformFeeCents(30000), 1500);
    assert.equal(calculatePlatformFeeCents(0), 0);
  });

  it("builds order total with fee", () => {
    assert.deepEqual(calculateOrderTotalWithPlatformFee(30000), {
      subtotalCents: 30000,
      platformFeeCents: 1500,
      totalCents: 31500,
    });
  });
});
