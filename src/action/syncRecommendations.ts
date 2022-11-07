import { getNeteaseRecommendations } from "api/netease";
import {
  addSpotifyTracks,
  createSpotifyPlaylist,
  searchSpotify,
} from "api/spotify";
import { mkdir, writeFile } from "fs/promises";
import { DateTime } from "luxon";
import { store } from "store";
import { schedulerLastSyncChanged } from "store/schedulerSlice";

interface SyncContextSnapshot {
  neteaseRecommendations: any;
  spotifyTracks: any;
  summaryText: string;
}

async function saveSyncContextSnapshot(syncContext: SyncContextSnapshot) {
  const base = `state/snapshots/${DateTime.now().toFormat(
    "yyyy-MM-dd HHmmss"
  )}`;
  await mkdir(base, { recursive: true });
  await writeFile(
    `${base}/netease-recommendations.json`,
    JSON.stringify(syncContext.neteaseRecommendations, null, 2)
  );
  await writeFile(
    `${base}/spotify-tracks.json`,
    JSON.stringify(syncContext.spotifyTracks, null, 2)
  );
  await writeFile(`${base}/summary.md`, syncContext.summaryText);
}

export async function dispatchSyncRecommendations() {
  const now = DateTime.now().toISO();

  const { recommendations, recommendationsOriginal } =
    await getNeteaseRecommendations();
  console.log("netease: got " + recommendations.length + " recommendations");

  const tracks = (
    await Promise.all(
      recommendations.map(async (song) => {
        const track = await searchSpotify(song);
        if (!track) {
          console.log(`spotify: ${song.name} not found`);
        }
        return {
          ...track,
          originalName: song.name,
          originalArtists: song.artists.join(", "),
          originalAlbum: song.album,
          originalReason: song.reason,
        };
      })
    )
  ).filter((track) => track !== null);
  console.log("spotify: found " + tracks.length + " tracks");

  const trackUris = tracks.map((track) => track.uri);
  const playlistId = await createSpotifyPlaylist(
    `Netease Daily crawled at ${now}`
  );
  console.log("spotify: created playlist " + playlistId);
  await addSpotifyTracks(playlistId, trackUris);
  console.log("spotify: added tracks to playlist");

  const summary = `## Netease Daily crawled at ${now}

## Original Songs
${tracks
  .map(
    (track) =>
      `- ${track.originalName} (${track.originalArtists}) - ${track.originalAlbum} - ${track.originalReason}`
  )
  .join("\n")}`;

  await saveSyncContextSnapshot({
    neteaseRecommendations: recommendationsOriginal,
    spotifyTracks: tracks,
    summaryText: summary,
  });

  store.dispatch(schedulerLastSyncChanged(now));

  console.log("finished syncing recommendations at " + now);
}
