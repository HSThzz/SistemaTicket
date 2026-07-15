/**
 * @file Testes unitários de slugify de títulos de evento.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { slugifyEventTitle } from "../../src/modules/catalog/application/helpers/slugifyEventTitle";

describe("slugifyEventTitle", () => {
  it("normalizes accents and spaces", () => {
    assert.equal(slugifyEventTitle("Festival de Verão SP"), "festival-de-verao-sp");
  });

  it("collapses punctuation into hyphens", () => {
    assert.equal(slugifyEventTitle("Rock & Roll!!! Night"), "rock-roll-night");
  });

  it("falls back when title has no alphanumerics", () => {
    assert.equal(slugifyEventTitle("!!!"), "evento");
  });
});
