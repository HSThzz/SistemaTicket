import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { matchEventsToArtists } from "../../src/modules/catalog/application/helpers/matchEventsToArtists";
import type { Event } from "../../src/shared/infrastructure/persistence/entities/Event";
import { EventStatus, EventType } from "../../src/shared/kernel/enums";

function buildEvent(partial: Partial<Event> & Pick<Event, "title">): Event {
  return {
    id: "event-1",
    producerId: "producer-1",
    slug: "event-1",
    description: "",
    date: new Date("2026-08-01T20:00:00.000Z"),
    location: "São Paulo, SP",
    imageUrl: null,
    artists: [],
    status: EventStatus.PUBLISHED,
    type: EventType.PUBLIC,
    deletedAt: null,
    ticketLots: [],
    producer: {} as Event["producer"],
    ...partial,
  } as Event;
}

describe("matchEventsToArtists", () => {
  it("matches artist names listed on the event", () => {
    const events = [
      buildEvent({
        title: "Sunset Electronic Fest",
        artists: ["Alok", "Vintage Culture"],
      }),
      buildEvent({
        title: "Tech Summit",
        artists: [],
      }),
    ];

    const matches = matchEventsToArtists(events, [
      { id: "1", name: "Alok" },
      { id: "2", name: "Drake" },
    ]);

    assert.equal(matches.length, 1);
    assert.equal(matches[0]?.event.title, "Sunset Electronic Fest");
    assert.deepEqual(
      matches[0]?.matchedArtists.map((artist) => artist.name),
      ["Alok"],
    );
  });

  it("matches accents and case-insensitively", () => {
    const events = [
      buildEvent({
        title: "Rock Nacional",
        artists: ["Legião Urbana"],
      }),
    ];

    const matches = matchEventsToArtists(events, [{ id: "1", name: "LEGIAO URBANA" }]);

    assert.equal(matches.length, 1);
  });
});
