import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveParticipationAccess } from "../../src/modules/participation/application/helpers/resolveParticipationAccess";
import { EventType } from "../../src/shared/kernel/enums";

const LOT_A = "11111111-1111-1111-1111-111111111111";
const LOT_B = "22222222-2222-2222-2222-222222222222";

describe("resolveParticipationAccess", () => {
  it("libera checkout para eventos públicos sem exigir aprovação", () => {
    const access = resolveParticipationAccess(EventType.PUBLIC, false, LOT_A, null);

    assert.deepEqual(access, { requiresApproval: false, allowed: true });
  });

  it("libera checkout quando o tipo do evento não pôde ser resolvido", () => {
    const access = resolveParticipationAccess(null, false, LOT_A, null);

    assert.deepEqual(access, { requiresApproval: false, allowed: true });
  });

  it("bloqueia evento privado sem solicitação aprovada", () => {
    const access = resolveParticipationAccess(EventType.PRIVATE, false, LOT_A, [LOT_A]);

    assert.deepEqual(access, {
      requiresApproval: true,
      allowed: false,
      denialReason: "NOT_APPROVED",
    });
  });

  it("libera evento privado com aprovação e lote liberado", () => {
    const access = resolveParticipationAccess(EventType.PRIVATE, true, LOT_A, [
      LOT_A,
      LOT_B,
    ]);

    assert.deepEqual(access, { requiresApproval: true, allowed: true });
  });

  it("bloqueia lote fora da lista liberada na aprovação", () => {
    const access = resolveParticipationAccess(EventType.PRIVATE, true, LOT_B, [LOT_A]);

    assert.deepEqual(access, {
      requiresApproval: true,
      allowed: false,
      denialReason: "LOT_NOT_ALLOWED",
    });
  });

  it("trata allowedTicketLotIds null como todos os lotes (legado)", () => {
    const access = resolveParticipationAccess(EventType.PRIVATE, true, LOT_A, null);

    assert.deepEqual(access, { requiresApproval: true, allowed: true });
  });
});
