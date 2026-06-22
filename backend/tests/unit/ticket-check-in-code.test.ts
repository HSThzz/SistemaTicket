import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  compactTicketCheckInCode,
  formatTicketCheckInCode,
  generateTicketCheckInCode,
  getTicketQrPayload,
  resolveTicketLookupCodes,
  TICKET_CHECK_IN_CODE_LENGTH,
} from "../../src/shared/kernel/ticketCheckInCode";

describe("ticketCheckInCode", () => {
  it("generates 8-char codes from the safe alphabet", () => {
    const code = generateTicketCheckInCode();
    assert.equal(code.length, TICKET_CHECK_IN_CODE_LENGTH);
    assert.match(code, /^[23456789ABCDEFGHJKMNPQRSTUVWXYZ]+$/);
  });

  it("formats and compacts manual input", () => {
    assert.equal(formatTicketCheckInCode("abcd efgh"), "ABCD-EFGH");
    assert.equal(compactTicketCheckInCode(" abcd-efgh "), "ABCDEFGH");
  });

  it("prefers short check-in code in QR payload", () => {
    assert.equal(
      getTicketQrPayload({ checkInCode: "ABCDEFGH", uniqueCode: "a".repeat(64) }),
      "ABCDEFGH",
    );
  });

  it("resolves legacy hex unique codes", () => {
    const legacy = "a".repeat(64);
    assert.deepEqual(resolveTicketLookupCodes(legacy), {
      compactCheckInCode: legacy,
      uniqueCode: legacy,
    });
  });

  it("resolves short codes for portaria lookup", () => {
    assert.deepEqual(resolveTicketLookupCodes("ABCD-EFGH"), {
      compactCheckInCode: "ABCDEFGH",
      uniqueCode: null,
    });
  });
});
