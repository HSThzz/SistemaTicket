import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInstagramProfileUrl,
  isValidInstagramHandle,
  normalizeInstagramHandle,
} from "../../src/modules/participation/application/helpers/normalizeInstagramHandle";

describe("normalizeInstagramHandle", () => {
  it("strips @ and URLs", () => {
    assert.equal(normalizeInstagramHandle("@vibra.events"), "vibra.events");
    assert.equal(
      normalizeInstagramHandle("https://www.instagram.com/vibra.events/"),
      "vibra.events",
    );
    assert.equal(normalizeInstagramHandle("  "), undefined);
  });

  it("validates username charset", () => {
    assert.equal(isValidInstagramHandle("vibra.events"), true);
    assert.equal(isValidInstagramHandle("bad handle"), false);
  });

  it("builds profile url", () => {
    assert.equal(
      buildInstagramProfileUrl("vibra.events"),
      "https://www.instagram.com/vibra.events/",
    );
  });
});
