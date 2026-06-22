import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { resolveParticipationAccess } from "../../src/modules/participation/application/helpers/resolveParticipationAccess";
import { EventType } from "../../src/shared/kernel/enums";

describe("resolveParticipationAccess", () => {
  it("libera checkout para eventos públicos sem exigir aprovação", () => {
    const access = resolveParticipationAccess(EventType.PUBLIC, 0);

    assert.deepEqual(access, { requiresApproval: false, allowed: true });
  });

  it("libera checkout quando o tipo do evento não pôde ser resolvido", () => {
    const access = resolveParticipationAccess(null, 0);

    assert.deepEqual(access, { requiresApproval: false, allowed: true });
  });

  it("bloqueia evento privado sem solicitação aprovada", () => {
    const access = resolveParticipationAccess(EventType.PRIVATE, 0);

    assert.deepEqual(access, { requiresApproval: true, allowed: false });
  });

  it("libera evento privado com ao menos uma solicitação aprovada", () => {
    const access = resolveParticipationAccess(EventType.PRIVATE, 1);

    assert.deepEqual(access, { requiresApproval: true, allowed: true });
  });
});
