import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mapReviewDecisionToStatus } from "../../src/modules/participation/application/helpers/mapReviewDecisionToStatus";
import { ParticipationRequestStatus } from "../../src/shared/kernel/enums";
import { ParticipationReviewDecision } from "../../src/modules/participation/validators/schema/reviewParticipationRequestSchema";

describe("mapReviewDecisionToStatus", () => {
  it("mapeia APPROVE para APPROVED", () => {
    assert.equal(
      mapReviewDecisionToStatus(ParticipationReviewDecision.APPROVE),
      ParticipationRequestStatus.APPROVED,
    );
  });

  it("mapeia REJECT para REJECTED", () => {
    assert.equal(
      mapReviewDecisionToStatus(ParticipationReviewDecision.REJECT),
      ParticipationRequestStatus.REJECTED,
    );
  });
});
