import { findPublishedEvents } from "../../../../catalog/application/queries/findPublishedEvents";
import { matchEventsToArtists } from "../../../../catalog/application/helpers/matchEventsToArtists";
import { serializeEvent } from "../../../../catalog/application/helpers/serializeEvent";
import { fetchSpotifyTopArtists } from "../../SpotifyClient";
import { getValidSpotifyAccessToken } from "../spotifyConnectionStore";

export async function getSpotifyRecommendations(userId: string) {
  const { accessToken } = await getValidSpotifyAccessToken(userId);
  const artists = await fetchSpotifyTopArtists(accessToken, 25);
  const events = await findPublishedEvents();
  const matches = matchEventsToArtists(events, artists);

  return {
    artists: artists.map((artist) => ({ id: artist.id, name: artist.name })),
    events: matches.map((match) => ({
      ...serializeEvent(match.event),
      matchedArtists: match.matchedArtists,
    })),
  };
}
